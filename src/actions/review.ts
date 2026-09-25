"use server";

// Spec §4.H — Human Review & Override Workflow Server Actions
import { prisma } from "@/lib/prisma";
import { getAuthContext, getDbUserId, requireFullAccess } from "@/lib/auth";
import { preserveEvidence, recordAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

export async function getReviewQueue(filters?: { propertyId?: string }) {
  const { orgId } = await getAuthContext();

  return prisma.decision.findMany({
    where: {
      outcome: "PENDING_REVIEW",
      application: {
        organizationId: orgId,
        ...(filters?.propertyId && { propertyId: filters.propertyId }),
      },
    },
    include: {
      application: {
        include: { applicant: true, property: true },
      },
      reasonCodes: { orderBy: { sortOrder: "asc" } },
      individualizedAssessment: true,
    },
    orderBy: { createdAt: "asc" }, // FIFO
  });
}

export async function submitReview(
  decisionId: string,
  action: "APPROVE" | "DENY" | "ESCALATE" | "REQUEST_INFO",
  notes: string
): Promise<ActionResult> {
  const denied = await requireFullAccess();
  if (denied) return denied;
  const { orgId } = await getAuthContext();
  if (!notes.trim()) return { success: false, error: "Reviewer notes are required for the administrative record." };

  const decision = await prisma.decision.findFirst({
    where: { id: decisionId, application: { organizationId: orgId } },
    include: { application: true, reasonCodes: true, individualizedAssessment: true },
  });
  if (!decision) return { success: false, error: "Decision not found" };

  // HUD OGC criminal-history guidance: no adverse action without an individualized assessment
  const involvesCriminalHistory = decision.reasonCodes.some((rc) => rc.category === "Criminal" || rc.code.startsWith("CM-") || rc.code.startsWith("CH-"));
  if (involvesCriminalHistory && !decision.individualizedAssessment && (action === "APPROVE" || action === "DENY")) {
    return { success: false, error: "Complete the individualized assessment before issuing a final determination." };
  }

  const reviewerId = await getDbUserId();

  // One review per decision; a second review supersedes the first (both are preserved in the audit log)
  const review = await prisma.humanReview.upsert({
    where: { decisionId },
    create: { decisionId, reviewerId, action, notes },
    update: { reviewerId, action, notes, reviewedAt: new Date() },
  });

  // Update decision outcome based on review action
  const outcomeMap = {
    APPROVE: "APPROVED" as const,
    DENY: "DENIED" as const,
    ESCALATE: "PENDING_REVIEW" as const,
    REQUEST_INFO: "PENDING_REVIEW" as const,
  };

  await prisma.decision.update({
    where: { id: decisionId },
    data: { outcome: outcomeMap[action] },
  });

  // Update application status
  if (action === "APPROVE" || action === "DENY") {
    await prisma.application.update({
      where: { id: decision.applicationId },
      data: { status: "DECIDED", decidedAt: new Date() },
    });
  }

  await recordAudit({
    tableName: "HumanReview",
    recordId: review.id,
    action: `REVIEW_${action}`,
    before: { outcome: decision.outcome },
    after: { outcome: outcomeMap[action], notes },
    metadata: { decisionId, applicationId: decision.applicationId },
  });

  revalidatePath("/dashboard", "layout");
  return { success: true };
}

export async function submitOverride(
  decisionId: string,
  newOutcome: "APPROVED" | "DENIED" | "CONDITIONAL",
  justification: string
): Promise<ActionResult> {
  const denied = await requireFullAccess();
  if (denied) return denied;
  const { orgId } = await getAuthContext();
  if (justification.trim().length < 20) {
    return { success: false, error: "Overrides require a written justification of at least 20 characters." };
  }

  const decision = await prisma.decision.findFirst({
    where: { id: decisionId, application: { organizationId: orgId } },
    include: { application: true },
  });
  if (!decision) return { success: false, error: "Decision not found" };

  const overriddenById = await getDbUserId();

  const override = await prisma.override.upsert({
    where: { decisionId },
    create: { decisionId, overriddenById, originalOutcome: decision.outcome, newOutcome, justification },
    update: { overriddenById, originalOutcome: decision.outcome, newOutcome, justification, overriddenAt: new Date() },
  });

  // Update decision
  await prisma.decision.update({
    where: { id: decisionId },
    data: { outcome: newOutcome },
  });

  await prisma.application.update({
    where: { id: decision.applicationId },
    data: { status: "DECIDED", decidedAt: new Date() },
  });

  await recordAudit({
    tableName: "Override",
    recordId: override.id,
    action: "OVERRIDE",
    before: { outcome: decision.outcome },
    after: { outcome: newOutcome },
    metadata: { decisionId, applicationId: decision.applicationId, justification },
  });
  await preserveEvidence({
    entityType: "decision",
    entityId: decisionId,
    documentType: "override_justification",
    content: { originalOutcome: decision.outcome, newOutcome, justification, overriddenAt: override.overriddenAt },
    description: `Override ${decision.outcome} → ${newOutcome} with written justification`,
  });

  revalidatePath("/dashboard", "layout");
  return { success: true };
}

export async function getQueueStats() {
  const { orgId } = await getAuthContext();

  const [pendingReview, reviewed, overridden] = await Promise.all([
    prisma.decision.count({
      where: { outcome: "PENDING_REVIEW", application: { organizationId: orgId } },
    }),
    prisma.humanReview.count({
      where: { decision: { application: { organizationId: orgId } } },
    }),
    prisma.override.count({
      where: { decision: { application: { organizationId: orgId } } },
    }),
  ]);

  return { pendingReview, reviewed, overridden };
}
