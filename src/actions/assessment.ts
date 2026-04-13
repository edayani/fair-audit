"use server";
import { prisma } from "@/lib/prisma";
import { getAuthContext, requireFullAccess } from "@/lib/auth";
import { revalidatePath } from "next/cache";
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
  const { orgId, userId } = await getAuthContext();
  // Verify the decision belongs to this org
  await prisma.decision.findFirstOrThrow({
    where: { id: decisionId, application: { organizationId: orgId } },
  });

  // Upsert (allow re-assessment)
  const assessment = await prisma.individualizedAssessment.upsert({
    where: { decisionId },
    create: { ...data, decisionId, assessedBy: userId },
    update: { ...data, assessedBy: userId, assessedAt: new Date() },
  });

  revalidatePath("/dashboard/review-queue");
  return { success: true, data: { id: assessment.id } };
}

export async function getIndividualizedAssessment(decisionId: string) {
  const { orgId } = await getAuthContext();
  return prisma.individualizedAssessment.findUnique({
    where: { decisionId },
  });
}
