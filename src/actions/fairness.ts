"use server";

// Spec §4.F — Fairness Testing & Civil Rights Monitoring Server Actions
import { prisma } from "@/lib/prisma";
import { getAuthContext, requireFullAccess } from "@/lib/auth";
import { computeDisparateImpact, computeFairnessReport } from "@/lib/engines/fairness";
import { revalidatePath } from "next/cache";
import { preserveEvidence, recordAudit } from "@/lib/audit";
import type { ActionResult } from "@/types";

export async function runFairnessAnalysis(
  propertyId?: string,
  startDate?: string,
  endDate?: string
): Promise<ActionResult<{ reportId: string }>> {
  const denied = await requireFullAccess();
  if (denied) return denied;
  const { orgId } = await getAuthContext();

  const periodStart = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const periodEnd = endDate ? new Date(endDate) : new Date();

  // Fetch all decided applications in period
  const applications = await prisma.application.findMany({
    where: {
      organizationId: orgId,
      ...(propertyId && { propertyId }),
      decidedAt: { gte: periodStart, lte: periodEnd },
    },
    include: {
      applicant: true,
      decision: { include: { reasonCodes: true, override: true } },
      challenges: true,
    },
  });

  // Build analysis data
  const analysisData = applications
    .filter((a) => a.decision)
    .map((a) => ({
      outcome: a.decision!.outcome,
      demographics: {
        race: a.applicant.race,
        sex: a.applicant.sex,
        familialStatus: a.applicant.familialStatus,
        disability: a.applicant.disability ? "Yes" : a.applicant.disability === false ? "No" : null,
        nationalOrigin: a.applicant.nationalOrigin,
        sourceOfIncome: a.applicant.sourceOfIncome,
      },
      overridden: !!a.decision!.override,
      disputed: a.challenges.length > 0,
      disputeSucceeded: a.challenges.some((c) => c.status === "RESOLVED_ACCEPTED"),
      denialCriteria: a.decision!.reasonCodes.map((rc) => rc.category),
    }));

  const report = computeFairnessReport(analysisData, periodStart, periodEnd);

  if (analysisData.length === 0) {
    return { success: false, error: "No decided applications in the selected period. Decide applications first, then re-run the analysis." };
  }

  // Store metrics
  await prisma.fairnessMetric.createMany({
    data: report.disparateImpactResults.flatMap((di) =>
      di.groups.map((group) => ({
        organizationId: orgId,
        propertyId,
        metricType: "approval_rate",
        protectedClass: di.protectedClass,
        groupValue: group.groupName,
        value: group.approvalRate,
        sampleSize: group.total,
        periodStart,
        periodEnd,
        metadata: JSON.parse(JSON.stringify({ impactRatio: di.impactRatio, hasPotentialDisparateImpact: di.hasPotentialDisparateImpact })),
      }))
    ),
  });

  // Store report
  const dbReport = await prisma.disparityReport.create({
    data: {
      organizationId: orgId,
      propertyId,
      periodStart,
      periodEnd,
      summary: `Analysis of ${applications.length} applications. ${report.disparateImpactResults.filter((r) => r.hasPotentialDisparateImpact).length} potential disparate impact findings.`,
      findings: JSON.parse(JSON.stringify(report)),
    },
  });

  await recordAudit({
    tableName: "DisparityReport",
    recordId: dbReport.id,
    action: "FAIRNESS_ANALYSIS",
    after: { applications: analysisData.length, findings: report.disparateImpactResults.filter((r) => r.hasPotentialDisparateImpact).length },
  });

  revalidatePath("/dashboard", "layout");
  return { success: true, data: { reportId: dbReport.id } };
}

export async function getFairnessMetrics(propertyId?: string) {
  const { orgId } = await getAuthContext();

  return prisma.fairnessMetric.findMany({
    where: {
      organizationId: orgId,
      ...(propertyId && { propertyId }),
    },
    orderBy: { calculatedAt: "desc" },
    take: 100,
  });
}

export async function getDisparateImpactSummary() {
  const { orgId } = await getAuthContext();

  const applications = await prisma.application.findMany({
    where: { organizationId: orgId, decidedAt: { not: null } },
    include: { applicant: true, decision: true },
    take: 500,
  });

  const protectedClasses = ["race", "sex", "familialStatus", "sourceOfIncome"];
  return protectedClasses.map((pc) =>
    computeDisparateImpact(
      applications.filter((a) => a.decision).map((a) => ({
        outcome: a.decision!.outcome,
        demographics: {
          race: a.applicant.race,
          sex: a.applicant.sex,
          familialStatus: a.applicant.familialStatus,
          sourceOfIncome: a.applicant.sourceOfIncome,
        },
      })),
      pc
    )
  );
}

export async function getDisparityReports() {
  const { orgId } = await getAuthContext();
  return prisma.disparityReport.findMany({
    where: { organizationId: orgId },
    orderBy: { reportDate: "desc" },
  });
}

export async function getDisparityReport(id: string) {
  const { orgId } = await getAuthContext();
  return prisma.disparityReport.findFirst({
    where: { id, organizationId: orgId },
    include: { burdenShiftingAnalyses: { orderBy: { createdAt: "desc" } } },
  });
}

export async function submitBurdenShiftingAnalysis(
  disparityReportId: string,
  data: {
    protectedClass: string;
    impactRatio: number;
    isFaciallyNeutral?: boolean;
    facialNeutralityNotes?: string;
    lessDiscriminatoryAltExists?: boolean;
    lessDiscriminatoryAltNotes?: string;
    hasLegitimateObjective?: boolean;
    legitimateObjectiveNotes?: string;
    conclusion?: string;
    analystNotes?: string;
  }
): Promise<ActionResult<{ id: string }>> {
  const denied = await requireFullAccess();
  if (denied) return denied;
  const { orgId, userId, userEmail } = await getAuthContext();
  // Verify report belongs to org
  const report = await prisma.disparityReport.findFirst({
    where: { id: disparityReportId, organizationId: orgId },
    select: { id: true },
  });
  if (!report) return { success: false, error: "Disparity report not found" };

  const analysis = await prisma.burdenShiftingAnalysis.create({
    data: { ...data, disparityReportId, analyzedBy: userEmail ?? userId },
  });

  await recordAudit({
    tableName: "BurdenShiftingAnalysis",
    recordId: analysis.id,
    action: "BURDEN_SHIFTING_ANALYSIS",
    after: { protectedClass: data.protectedClass, conclusion: data.conclusion ?? null },
    metadata: { disparityReportId },
  });
  await preserveEvidence({
    entityType: "disparity_report",
    entityId: disparityReportId,
    documentType: "burden_shifting_analysis",
    content: data,
    description: `Three-step burden-shifting analysis — ${data.protectedClass}`,
  });

  revalidatePath("/dashboard/fairness", "layout");
  return { success: true, data: { id: analysis.id } };
}

export async function getBurdenShiftingAnalyses(disparityReportId: string) {
  const { orgId } = await getAuthContext();
  return prisma.burdenShiftingAnalysis.findMany({
    where: { disparityReportId, disparityReport: { organizationId: orgId } },
    orderBy: { createdAt: "desc" },
  });
}
