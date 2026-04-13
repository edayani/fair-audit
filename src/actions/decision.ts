"use server";

// Spec §4.G, §4.H — Decision Engine & Human Review Server Actions
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { evaluateApplication } from "@/lib/engines/decision";
import { generateReasonCodes } from "@/lib/engines/reason-codes";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

export async function runDecision(applicationId: string): Promise<ActionResult<{ decisionId: string }>> {
  const { orgId } = await getAuthContext();

  const application = await prisma.application.findFirstOrThrow({
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

  const org = await prisma.organization.findFirstOrThrow({ where: { id: orgId } });
  const activePolicy = application.property.screeningPolicies[0];
  if (!activePolicy) return { success: false, error: "No active screening policy" };

  // Delete existing decision if re-running
  await prisma.decision.deleteMany({ where: { applicationId } });

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

  revalidatePath(`/dashboard/applications/${applicationId}`);
  revalidatePath("/dashboard/review-queue");
  return { success: true, data: { decisionId: decision.id } };
}

export async function getDecision(applicationId: string) {
  const { orgId } = await getAuthContext();
  await prisma.application.findFirstOrThrow({ where: { id: applicationId, organizationId: orgId } });

  return prisma.decision.findFirst({
    where: { applicationId },
    include: {
      reasonCodes: { include: { policyRule: true }, orderBy: { sortOrder: "asc" } },
      humanReview: { include: { reviewer: true } },
      override: { include: { overriddenBy: true } },
      screeningPolicy: { include: { rules: true } },
      individualizedAssessment: true,
    },
  });
}
