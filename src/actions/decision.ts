"use server";

// Spec §4.G, §4.H — Decision Engine & Human Review Server Actions
import { prisma } from "@/lib/prisma";
import { getAuthContext, requireFullAccess } from "@/lib/auth";
import { evaluateApplication } from "@/lib/engines/decision";
import { generateReasonCodes } from "@/lib/engines/reason-codes";
import { revalidatePath } from "next/cache";
import { recordAudit } from "@/lib/audit";
import type { ActionResult } from "@/types";

export async function runDecision(applicationId: string): Promise<ActionResult<{ decisionId: string }>> {
  const denied = await requireFullAccess();
  if (denied) return denied;
  const { orgId } = await getAuthContext();

  const application = await prisma.application.findFirst({
    where: { id: applicationId, organizationId: orgId },
    include: {
      screeningRecords: true,
      accommodations: true,
      property: {
        include: {
          screeningPolicies: { where: { isActive: true }, include: { rules: true }, take: 1 },
        },
      },
    },
  });

  if (!application) return { success: false, error: "Application not found" };

  const org = await prisma.organization.findFirstOrThrow({ where: { id: orgId } });
  const activePolicy = application.property.screeningPolicies[0];
  if (!activePolicy) {
    return { success: false, error: "This property has no published screening policy. Publish one before running the pipeline." };
  }

  // Re-running supersedes the prior determination; the audit log retains the history.
  const previous = await prisma.decision.findUnique({ where: { applicationId }, select: { id: true, outcome: true } });
  if (previous) {
    await prisma.$transaction([
      prisma.humanReview.deleteMany({ where: { decisionId: previous.id } }),
      prisma.override.deleteMany({ where: { decisionId: previous.id } }),
      prisma.individualizedAssessment.deleteMany({ where: { decisionId: previous.id } }),
      prisma.reasonCode.deleteMany({ where: { decisionId: previous.id } }),
      prisma.decision.delete({ where: { id: previous.id } }),
    ]);
  }

  // Run the decision engine (Spec §4.G)
  const result = evaluateApplication(
    activePolicy.rules,
    application.screeningRecords,
    {
      hasVoucher: application.hasVoucher,
      hasAccommodationRequest: application.accommodations.length > 0,
      complianceMode: org.complianceMode,
    }
  );

  // Generate reason codes (Spec §4.G)
  const reasonCodes = generateReasonCodes(result.evaluations);

  // Create decision record
  const decision = await prisma.decision.create({
    data: {
      applicationId,
      screeningPolicyId: activePolicy.id,
      outcome: result.outcome,
      confidenceScore: result.confidenceScore,
      isAutomatic: !result.requiresHumanReview,
      evaluationData: JSON.parse(JSON.stringify({
        overallScore: result.overallScore,
        evaluations: result.evaluations,
        disqualifyingCriteria: result.disqualifyingCriteria,
        reviewReasons: result.reviewReasons,
      })),
      reasonCodes: {
        create: reasonCodes.map((rc, idx) => ({
          code: rc.code,
          category: rc.category,
          shortText: rc.shortText,
          detailedText: rc.detailedText,
          severity: rc.severity,
          policyRuleId: rc.policyRuleId || null,
          sortOrder: idx,
        })),
      },
    },
  });

  // Update application status
  await prisma.application.update({
    where: { id: applicationId },
    data: {
      status: result.outcome === "PENDING_REVIEW" ? "IN_REVIEW" : "DECIDED",
      decidedAt: result.outcome !== "PENDING_REVIEW" ? new Date() : null,
    },
  });

  await recordAudit({
    tableName: "Decision",
    recordId: decision.id,
    action: previous ? "RE_EVALUATE" : "EVALUATE",
    before: previous ? { outcome: previous.outcome } : null,
    after: { outcome: result.outcome, confidenceScore: result.confidenceScore, reasonCodes: reasonCodes.map((rc) => rc.code) },
    metadata: { applicationId, policyId: activePolicy.id, policyVersion: activePolicy.version, complianceMode: org.complianceMode },
  });

  revalidatePath("/dashboard", "layout");
  return { success: true, data: { decisionId: decision.id } };
}

export async function getDecision(applicationId: string) {
  const { orgId } = await getAuthContext();
  return prisma.decision.findFirst({
    where: { applicationId, application: { organizationId: orgId } },
    include: {
      reasonCodes: { include: { policyRule: true }, orderBy: { sortOrder: "asc" } },
      humanReview: { include: { reviewer: true } },
      override: { include: { overriddenBy: true } },
      screeningPolicy: { include: { rules: true } },
      individualizedAssessment: true,
    },
  });
}
