"use server";

import { prisma } from "@/lib/prisma";
import { getAuthContext, getAuthContextSafe, requireFullAccess } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import { computeDisparateImpact } from "@/lib/engines/fairness";

export async function getOrganization() {
  const { orgId } = await getAuthContext();
  return prisma.organization.findFirst({
    where: { id: orgId },
  });
}

export async function updateOrganization(data: {
  name?: string;
}): Promise<ActionResult> {
  const { orgId } = await getAuthContext();
  const denied = await requireFullAccess();
  if (denied) return denied;

  await prisma.organization.updateMany({
    where: { id: orgId },
    data,
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function getDashboardStats() {
  const ctx = await getAuthContextSafe();
  if (!ctx) return null;
  const { orgId } = ctx;
  const inOrg = { application: { organizationId: orgId } };

  const [
    propertyCount,
    applicantCount,
    totalApplications,
    outcomeGroups,
    openChallenges,
    pendingAccommodations,
    alerts,
    reviewQueue,
    recentActivity,
    auditCount,
    evidenceCount,
    adverseDecisions,
    adverseWithNotice,
    decisionsWithReasons,
    criminalDecisions,
    criminalWithAssessment,
    reviewedCount,
    overrideCount,
    decidedApps,
  ] = await Promise.all([
    prisma.property.count({ where: { organizationId: orgId } }),
    prisma.applicant.count({ where: { organizationId: orgId } }),
    prisma.application.count({ where: { organizationId: orgId } }),
    prisma.decision.groupBy({ by: ["outcome"], where: inOrg, _count: { _all: true } }),
    prisma.challenge.count({ where: { ...inOrg, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
    prisma.accommodation.count({ where: { ...inOrg, status: "PENDING" } }),
    prisma.driftAlert.findMany({
      where: { organizationId: orgId, status: { in: ["NEW", "ACKNOWLEDGED", "INVESTIGATING"] } },
      orderBy: [{ detectedAt: "desc" }],
      take: 4,
    }),
    prisma.decision.findMany({
      where: { ...inOrg, outcome: "PENDING_REVIEW" },
      include: { application: { include: { applicant: true, property: true } }, reasonCodes: { take: 1, orderBy: { sortOrder: "asc" } } },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
    prisma.auditLog.findMany({ where: { organizationId: orgId }, orderBy: { timestamp: "desc" }, take: 8 }),
    prisma.auditLog.count({ where: { organizationId: orgId } }),
    prisma.evidenceVaultEntry.count({ where: { organizationId: orgId } }),
    prisma.decision.count({ where: { ...inOrg, outcome: { in: ["DENIED", "CONDITIONAL"] } } }),
    prisma.decision.count({
      where: { ...inOrg, outcome: { in: ["DENIED", "CONDITIONAL"] }, application: { organizationId: orgId, notices: { some: {} } } },
    }),
    prisma.decision.count({ where: { ...inOrg, OR: [{ reasonCodes: { some: {} } }, { outcome: "APPROVED" }] } }),
    prisma.decision.count({ where: { ...inOrg, reasonCodes: { some: { category: "Criminal" } } } }),
    prisma.decision.count({ where: { ...inOrg, reasonCodes: { some: { category: "Criminal" } }, individualizedAssessment: { isNot: null } } }),
    prisma.humanReview.count({ where: { decision: inOrg } }),
    prisma.override.count({ where: { decision: inOrg } }),
    prisma.application.findMany({
      where: { organizationId: orgId, decision: { isNot: null } },
      select: { decision: { select: { outcome: true } }, applicant: { select: { race: true, sex: true, familialStatus: true, sourceOfIncome: true } } },
      take: 1000,
    }),
  ]);

  const outcomes = { APPROVED: 0, DENIED: 0, CONDITIONAL: 0, PENDING_REVIEW: 0 } as Record<string, number>;
  for (const g of outcomeGroups) outcomes[g.outcome] = g._count._all;
  const totalDecisions = Object.values(outcomes).reduce((a, b) => a + b, 0);
  const finalDecisions = outcomes.APPROVED + outcomes.DENIED + outcomes.CONDITIONAL;

  const fairnessInput = decidedApps.map((a) => ({
    outcome: a.decision!.outcome,
    demographics: { ...a.applicant } as Record<string, string | null>,
  }));
  const disparate = ["race", "sex", "familialStatus", "sourceOfIncome"]
    .map((pc) => computeDisparateImpact(fairnessInput, pc))
    .filter((r) => r.groups.length >= 2);
  const lowestImpact = disparate.length > 0 ? disparate.reduce((min, r) => (r.impactRatio < min.impactRatio ? r : min)) : null;

  const ratio = (num: number, den: number) => (den > 0 ? num / den : null);

  return {
    propertyCount,
    applicantCount,
    totalApplications,
    totalDecisions,
    outcomes,
    pendingReviews: outcomes.PENDING_REVIEW,
    approvalRate: finalDecisions > 0 ? outcomes.APPROVED / finalDecisions : 0,
    denialRate: finalDecisions > 0 ? outcomes.DENIED / finalDecisions : 0,
    openChallenges,
    pendingAccommodations,
    alerts,
    reviewQueue,
    recentActivity,
    auditCount,
    evidenceCount,
    overrideCount,
    disparityFindings: disparate.filter((r) => r.hasPotentialDisparateImpact).length,
    lowestImpact: lowestImpact ? { protectedClass: lowestImpact.protectedClass, impactRatio: lowestImpact.impactRatio } : null,
    posture: {
      explainability: ratio(decisionsWithReasons, totalDecisions),
      noticeCoverage: ratio(adverseWithNotice, adverseDecisions),
      individualizedAssessment: ratio(criminalWithAssessment, criminalDecisions),
      humanOversight: ratio(reviewedCount + overrideCount, totalDecisions),
    },
  };
}
