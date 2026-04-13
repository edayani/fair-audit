"use server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

export async function getComplianceScores() {
  const { orgId } = await getAuthContext();

  // 1. Fairness Score: weighted average of impact ratios from disparate_impact metrics
  const fairnessMetrics = await prisma.fairnessMetric.findMany({
    where: { organizationId: orgId },
    orderBy: { calculatedAt: "desc" },
    take: 100,
  });

  let fairnessScore = 0;
  const diMetrics = fairnessMetrics.filter((m) => {
    const meta = m.metadata as { impactRatio?: number } | null;
    return meta?.impactRatio !== undefined;
  });
  if (diMetrics.length > 0) {
    const avgRatio = diMetrics.reduce((sum, m) => {
      const meta = m.metadata as { impactRatio?: number };
      return sum + (meta.impactRatio ?? 0);
    }, 0) / diMetrics.length;
    fairnessScore = Math.min(avgRatio * 100, 100);
  }

  // 2. Transparency Score: decisions with >= 1 reason code / total decisions
  const totalDecisions = await prisma.decision.count({
    where: { application: { organizationId: orgId } },
  });
  const decisionsWithReasons = await prisma.decision.count({
    where: {
      application: { organizationId: orgId },
      reasonCodes: { some: {} },
    },
  });
  const transparencyScore = totalDecisions > 0 ? (decisionsWithReasons / totalDecisions) * 100 : 0;

  // 3. Accountability Score: (resolved drift alerts + acknowledged proxy risks) / (total drift + total flagged)
  const totalDriftAlerts = await prisma.driftAlert.count({
    where: { organizationId: orgId },
  });
  const resolvedDriftAlerts = await prisma.driftAlert.count({
    where: { organizationId: orgId, status: "RESOLVED" },
  });
  const totalFlaggedFeatures = await prisma.featureRegistry.count({
    where: { organizationId: orgId, flaggedAsProxy: true },
  });
  const acknowledgedProxyRisks = await prisma.featureRegistry.count({
    where: { organizationId: orgId, flaggedAsProxy: true, legalReviewStatus: { not: null } },
  });

  const accountabilityDenom = totalDriftAlerts + totalFlaggedFeatures;
  const accountabilityScore = accountabilityDenom > 0
    ? ((resolvedDriftAlerts + acknowledgedProxyRisks) / accountabilityDenom) * 100
    : 0;

  // 4. Explainability Score: decisions with individualized assessment / criminal decisions
  const criminalDecisions = await prisma.decision.count({
    where: {
      application: { organizationId: orgId },
      reasonCodes: { some: { category: { contains: "Criminal", mode: "insensitive" } } },
    },
  });
  const decisionsWithIA = await prisma.decision.count({
    where: {
      application: { organizationId: orgId },
      individualizedAssessment: { isNot: null },
    },
  });
  const explainabilityScore = criminalDecisions > 0
    ? (decisionsWithIA / criminalDecisions) * 100
    : 100;

  // 5. Human Oversight Rate: decisions with human review / total decisions
  const decisionsWithHumanReview = await prisma.decision.count({
    where: {
      application: { organizationId: orgId },
      humanReview: { isNot: null },
    },
  });
  const humanOversightRate = totalDecisions > 0
    ? (decisionsWithHumanReview / totalDecisions) * 100
    : 0;

  // 6. Audit Completeness: audit log entries / expected (estimate based on total mutations)
  const auditLogCount = await prisma.auditLog.count({
    where: { organizationId: orgId },
  });
  const totalApplications = await prisma.application.count({
    where: { organizationId: orgId },
  });
  // Expected: at least 1 audit entry per application + 1 per decision + 1 per challenge
  const totalChallenges = await prisma.challenge.count({
    where: { application: { organizationId: orgId } },
  });
  const expectedEntries = totalApplications + totalDecisions + totalChallenges;
  const auditCompleteness = expectedEntries > 0
    ? Math.min((auditLogCount / expectedEntries) * 100, 100)
    : 0;

  // Overall grade
  const scores = [fairnessScore, transparencyScore, accountabilityScore, explainabilityScore, humanOversightRate, auditCompleteness];
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  let overallGrade: string;
  if (average >= 90) overallGrade = "A";
  else if (average >= 80) overallGrade = "B";
  else if (average >= 70) overallGrade = "C";
  else if (average >= 60) overallGrade = "D";
  else overallGrade = "F";

  // Risk classification based on fairness data
  let riskClassification = "LOW";
  const impactRatios = diMetrics.map((m) => (m.metadata as { impactRatio?: number })?.impactRatio ?? 1);
  if (impactRatios.some((r) => r < 0.6)) riskClassification = "UNACCEPTABLE";
  else if (impactRatios.some((r) => r < 0.8)) riskClassification = "HIGH";
  else if (totalDecisions > 0) {
    const overrideCount = await prisma.override.count({
      where: { decision: { application: { organizationId: orgId } } },
    });
    if (overrideCount / totalDecisions > 0.2) riskClassification = "MEDIUM";
  }

  return {
    fairnessScore: Math.round(fairnessScore * 10) / 10,
    transparencyScore: Math.round(transparencyScore * 10) / 10,
    accountabilityScore: Math.round(accountabilityScore * 10) / 10,
    explainabilityScore: Math.round(explainabilityScore * 10) / 10,
    humanOversightRate: Math.round(humanOversightRate * 10) / 10,
    auditCompleteness: Math.round(auditCompleteness * 10) / 10,
    overallGrade,
    riskClassification,
  };
}

export async function generateAIA(): Promise<ActionResult<{ id: string }>> {
  const { orgId, userId } = await getAuthContext();

  const scores = await getComplianceScores();

  // Compute risk classification from raw fairness data
  const fairnessMetrics = await prisma.fairnessMetric.findMany({
    where: { organizationId: orgId },
    orderBy: { calculatedAt: "desc" },
    take: 100,
  });

  const impactRatios = fairnessMetrics
    .filter((m) => {
      const meta = m.metadata as { impactRatio?: number } | null;
      return meta?.impactRatio !== undefined;
    })
    .map((m) => (m.metadata as { impactRatio: number }).impactRatio);

  let riskClassification = "LOW";
  if (impactRatios.some((r) => r < 0.6)) {
    riskClassification = "UNACCEPTABLE";
  } else if (impactRatios.some((r) => r < 0.8)) {
    riskClassification = "HIGH";
  } else {
    const totalDecisions = await prisma.decision.count({
      where: { application: { organizationId: orgId } },
    });
    if (totalDecisions > 0) {
      const overrideCount = await prisma.override.count({
        where: { decision: { application: { organizationId: orgId } } },
      });
      if (overrideCount / totalDecisions > 0.2) riskClassification = "MEDIUM";
    }
  }

  // Build findings from current data
  const proxyFlags = await prisma.featureRegistry.findMany({
    where: { organizationId: orgId, flaggedAsProxy: true },
    select: { name: true, proxyFor: true, proxyExplanation: true },
  });

  const driftAlerts = await prisma.driftAlert.findMany({
    where: { organizationId: orgId, status: { not: "RESOLVED" } },
    select: { title: true, severity: true, driftType: true, description: true },
    take: 20,
  });

  const findings = {
    fairnessMetricsSummary: fairnessMetrics.slice(0, 20).map((m) => ({
      protectedClass: m.protectedClass,
      groupValue: m.groupValue,
      value: m.value,
      metadata: m.metadata,
    })),
    proxyRiskFlags: proxyFlags,
    activeDriftAlerts: driftAlerts,
    scores,
  };

  // Build mitigation actions from burden-shifting analyses and resolved challenges
  const burdenAnalyses = await prisma.burdenShiftingAnalysis.findMany({
    where: { disparityReport: { organizationId: orgId } },
    select: { protectedClass: true, conclusion: true, analystNotes: true },
    take: 20,
  });

  const resolvedChallenges = await prisma.challenge.findMany({
    where: {
      application: { organizationId: orgId },
      status: { in: ["RESOLVED_ACCEPTED", "RESOLVED_REJECTED"] },
    },
    select: { type: true, status: true, resolution: true },
    take: 20,
  });

  const mitigationActions = {
    burdenShiftingAnalyses: burdenAnalyses,
    resolvedChallenges,
  };

  const aia = await prisma.algorithmicImpactAssessment.create({
    data: {
      organizationId: orgId,
      systemDescription: "FairAudit Screening Compliance Engine",
      riskClassification,
      fairnessScore: scores.fairnessScore,
      transparencyScore: scores.transparencyScore,
      accountabilityScore: scores.accountabilityScore,
      explainabilityScore: scores.explainabilityScore,
      humanOversightRate: scores.humanOversightRate,
      auditCompleteness: scores.auditCompleteness,
      findings: JSON.parse(JSON.stringify(findings)),
      mitigationActions: JSON.parse(JSON.stringify(mitigationActions)),
      generatedBy: userId,
    },
  });

  revalidatePath("/dashboard/ai-governance");
  return { success: true, data: { id: aia.id } };
}

export async function getAIAReports() {
  const { orgId } = await getAuthContext();
  return prisma.algorithmicImpactAssessment.findMany({
    where: { organizationId: orgId },
    orderBy: { reportDate: "desc" },
  });
}
