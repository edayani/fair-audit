"use server";

// Spec §4.H — Human Review & Override Workflow Server Actions
import { prisma } from "@/lib/prisma";
import { getAuthContext, requireFullAccess } from "@/lib/auth";
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
  const { orgId, userId } = await getAuthContext();
  const denied = await requireFullAccess();
  if (denied) return denied;

  const decision = await prisma.decision.findFirstOrThrow({
    where: { id: decisionId },
    include: { application: true },
  });

  if (decision.application.organizationId !== orgId) {
    return { success: false, error: "Unauthorized" };
  }

  // Create human review record
  await prisma.humanReview.create({
    data: {
      decisionId,
      reviewerId: userId,
      action,
      notes,
    },
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

  revalidatePath("/dashboard/review-queue");
  revalidatePath(`/dashboard/applications/${decision.applicationId}`);
  return { success: true };
}

export async function submitOverride(
  decisionId: string,
  newOutcome: "APPROVED" | "DENIED" | "CONDITIONAL",
  justification: string
): Promise<ActionResult> {
  const { orgId, userId } = await getAuthContext();
  const denied = await requireFullAccess();
  if (denied) return denied;

  const decision = await prisma.decision.findFirstOrThrow({
    where: { id: decisionId },
    include: { application: true },
  });

  if (decision.application.organizationId !== orgId) {
    return { success: false, error: "Unauthorized" };
  }

  // Create override record
  await prisma.override.create({
    data: {
      decisionId,
      overriddenById: userId,
      originalOutcome: decision.outcome,
      newOutcome,
      justification,
    },
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

  revalidatePath("/dashboard/review-queue");
  revalidatePath(`/dashboard/applications/${decision.applicationId}`);
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
