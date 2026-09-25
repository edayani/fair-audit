"use server";
import { prisma } from "@/lib/prisma";
import { getAuthContext, requireFullAccess } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { preserveEvidence, recordAudit } from "@/lib/audit";
import type { ActionResult } from "@/types";

export async function submitIndividualizedAssessment(
  decisionId: string,
  data: {
    natureAndSeriousness: string;
    natureSeverity: number; // 1-5
    timeElapsed: string;
    timeElapsedMonths: number;
    rehabilitation: string;
    rehabilitationScore: number; // 1-5
    mitigatingCircumstances: string;
    mitigatingScore: number; // 1-5
    tenancyNexus: string;
    overallAssessment: string;
    recommendedOutcome: string; // APPROVE, DENY, CONDITIONAL
  }
): Promise<ActionResult<{ id: string }>> {
  const denied = await requireFullAccess();
  if (denied) return denied;
  const { orgId, userId, userEmail } = await getAuthContext();
  // Verify the decision belongs to this org
  const decision = await prisma.decision.findFirst({
    where: { id: decisionId, application: { organizationId: orgId } },
    select: { id: true, applicationId: true },
  });
  if (!decision) return { success: false, error: "Decision not found" };

  // Upsert (allow re-assessment)
  const assessment = await prisma.individualizedAssessment.upsert({
    where: { decisionId },
    create: { ...data, decisionId, assessedBy: userEmail ?? userId },
    update: { ...data, assessedBy: userEmail ?? userId, assessedAt: new Date() },
  });

  await recordAudit({
    tableName: "IndividualizedAssessment",
    recordId: assessment.id,
    action: "INDIVIDUALIZED_ASSESSMENT",
    after: { recommendedOutcome: data.recommendedOutcome },
    metadata: { decisionId, applicationId: decision.applicationId },
  });
  await preserveEvidence({
    entityType: "decision",
    entityId: decisionId,
    documentType: "individualized_assessment",
    content: data,
    description: "HUD four-factor individualized assessment of criminal history",
  });

  revalidatePath("/dashboard", "layout");
  return { success: true, data: { id: assessment.id } };
}

export async function getIndividualizedAssessment(decisionId: string) {
  const { orgId } = await getAuthContext();
  return prisma.individualizedAssessment.findFirst({
    where: { decisionId, decision: { application: { organizationId: orgId } } },
  });
}
