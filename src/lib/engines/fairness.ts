// Spec §4.F — Fairness Testing & Civil-Rights Monitoring
// HUD: check outputs for unjustified discriminatory effects,
// validate whether models have disparate outcomes,
// and test whether less discriminatory alternatives exist

export interface DisparateImpactResult {
  protectedClass: string;
  groups: GroupMetric[];
  highestRate: number;
  lowestRate: number;
  impactRatio: number;     // lowest / highest — below 0.8 = potential disparate impact
  hasPotentialDisparateImpact: boolean;
}

export interface GroupMetric {
  groupName: string;
  total: number;
  approved: number;
  denied: number;
  conditional: number;
  approvalRate: number;
}

export interface FairnessReport {
  periodStart: Date;
  periodEnd: Date;
  totalApplications: number;
  overallApprovalRate: number;
  disparateImpactResults: DisparateImpactResult[];
  overrideRate: number;
  disputeSuccessRate: number;
  topDenialCriteria: { criterion: string; count: number; percentage: number }[];
}

/**
 * Compute disparate impact ratio using the four-fifths (80%) rule.
 * For each protected class, if any group's approval rate is less than 80%
 * of the highest group's rate, flag potential disparate impact.
 */
export function computeDisparateImpact(
  applications: Array<{
    outcome: string;
    demographics: Record<string, string | null>;
  }>,
  protectedClass: string
): DisparateImpactResult {
  // Group applications by protected class value
  const groups = new Map<string, { total: number; approved: number; denied: number; conditional: number }>();

  for (const app of applications) {
    const groupValue = app.demographics[protectedClass] ?? "Unknown";
    const current = groups.get(groupValue) ?? { total: 0, approved: 0, denied: 0, conditional: 0 };
    current.total++;

    switch (app.outcome) {
      case "APPROVED":
        current.approved++;
        break;
      case "DENIED":
        current.denied++;
        break;
      case "CONDITIONAL":
        current.conditional++;
        break;
    }

    groups.set(groupValue, current);
  }

  // Compute approval rates per group (minimum sample size: 5)
  const groupMetrics: GroupMetric[] = [];
  for (const [name, data] of groups) {
    if (data.total >= 5) { // Statistical significance floor
      groupMetrics.push({
        groupName: name,
        total: data.total,
        approved: data.approved,
        denied: data.denied,
        conditional: data.conditional,
        approvalRate: data.total > 0 ? data.approved / data.total : 0,
      });
    }
  }

  if (groupMetrics.length < 2) {
    return {
      protectedClass,
      groups: groupMetrics,
      highestRate: groupMetrics[0]?.approvalRate ?? 0,
      lowestRate: groupMetrics[0]?.approvalRate ?? 0,
      impactRatio: 1,
      hasPotentialDisparateImpact: false,
    };
  }

  const sortedByRate = [...groupMetrics].sort((a, b) => b.approvalRate - a.approvalRate);
  const highestRate = sortedByRate[0].approvalRate;
  const lowestRate = sortedByRate[sortedByRate.length - 1].approvalRate;
  const impactRatio = highestRate > 0 ? lowestRate / highestRate : 1;

  return {
    protectedClass,
    groups: groupMetrics,
    highestRate,
    lowestRate,
    impactRatio,
    hasPotentialDisparateImpact: impactRatio < 0.8,
  };
}

/**
 * Compute comprehensive fairness report across all protected classes.
 */
export function computeFairnessReport(
  applications: Array<{
    outcome: string;
    demographics: Record<string, string | null>;
    overridden: boolean;
    disputed: boolean;
    disputeSucceeded: boolean;
    denialCriteria: string[];
  }>,
  periodStart: Date,
  periodEnd: Date
): FairnessReport {
  const protectedClasses = ["race", "sex", "familialStatus", "disability", "nationalOrigin", "sourceOfIncome"];

  const totalApplications = applications.length;
  const approvedCount = applications.filter((a) => a.outcome === "APPROVED").length;
  const overallApprovalRate = totalApplications > 0 ? approvedCount / totalApplications : 0;

  const disparateImpactResults = protectedClasses.map((pc) =>
    computeDisparateImpact(applications, pc)
  );

  const overrideRate = applications.filter((a) => a.overridden).length / Math.max(totalApplications, 1);
  const disputes = applications.filter((a) => a.disputed);
  const disputeSuccessRate = disputes.length > 0
    ? disputes.filter((a) => a.disputeSucceeded).length / disputes.length
    : 0;

  // Top denial criteria
  const criteriaCount = new Map<string, number>();
  for (const app of applications) {
    if (app.outcome === "DENIED") {
      for (const criterion of app.denialCriteria) {
        criteriaCount.set(criterion, (criteriaCount.get(criterion) ?? 0) + 1);
      }
    }
  }
  const deniedCount = applications.filter((a) => a.outcome === "DENIED").length;
  const topDenialCriteria = [...criteriaCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([criterion, count]) => ({
      criterion,
      count,
      percentage: deniedCount > 0 ? count / deniedCount : 0,
    }));

  return {
    periodStart,
    periodEnd,
    totalApplications,
    overallApprovalRate,
    disparateImpactResults,
    overrideRate,
    disputeSuccessRate,
    topDenialCriteria,
  };
}
