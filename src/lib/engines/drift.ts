// Spec §4.L — Continuous Monitoring & Drift Detection
// HUD: ongoing monitoring is important because datasets can become
// incomplete or unrepresentative over time
// NIST: AI risks should be tracked over time

export interface DriftCheckResult {
  type: "POLICY_DRIFT" | "DATA_DRIFT" | "DISPARITY_DRIFT";
  detected: boolean;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  description: string;
  metricName: string;
  baselineValue: number;
  currentValue: number;
  deviationPct: number;
  threshold: number;
}

/**
 * Check for policy drift — staff overriding written policy too often.
 */
export function checkPolicyDrift(
  totalDecisions: number,
  overrideCount: number,
  baselineOverrideRate: number = 0.10 // 10% baseline
): DriftCheckResult {
  const currentRate = totalDecisions > 0 ? overrideCount / totalDecisions : 0;
  const deviation = baselineOverrideRate > 0
    ? Math.abs(currentRate - baselineOverrideRate) / baselineOverrideRate
    : 0;

  return {
    type: "POLICY_DRIFT",
    detected: deviation > 0.5, // 50% deviation from baseline
    severity: deviation > 1.0 ? "CRITICAL" : deviation > 0.75 ? "HIGH" : deviation > 0.5 ? "MEDIUM" : "LOW",
    title: "Policy Override Rate Drift",
    description: `Override rate is ${(currentRate * 100).toFixed(1)}% vs baseline ${(baselineOverrideRate * 100).toFixed(1)}%. ` +
      (deviation > 0.5 ? "Staff may be deviating significantly from written policy." : "Override rate is within normal range."),
    metricName: "override_rate",
    baselineValue: baselineOverrideRate,
    currentValue: currentRate,
    deviationPct: deviation * 100,
    threshold: 50,
  };
}

/**
 * Check for data drift — vendor data quality degradation.
 */
export function checkDataDrift(
  currentPeriod: { totalRecords: number; missingDisposition: number; lowConfidence: number; staleRecords: number },
  baselinePeriod: { totalRecords: number; missingDisposition: number; lowConfidence: number; staleRecords: number }
): DriftCheckResult[] {
  const results: DriftCheckResult[] = [];

  // Missing disposition rate
  const currentMissingRate = currentPeriod.totalRecords > 0
    ? currentPeriod.missingDisposition / currentPeriod.totalRecords : 0;
  const baselineMissingRate = baselinePeriod.totalRecords > 0
    ? baselinePeriod.missingDisposition / baselinePeriod.totalRecords : 0;

  const missingDeviation = baselineMissingRate > 0
    ? (currentMissingRate - baselineMissingRate) / baselineMissingRate : 0;

  results.push({
    type: "DATA_DRIFT",
    detected: missingDeviation > 0.25,
    severity: missingDeviation > 0.75 ? "HIGH" : missingDeviation > 0.5 ? "MEDIUM" : "LOW",
    title: "Missing Disposition Rate Increase",
    description: `Records without clear dispositions: ${(currentMissingRate * 100).toFixed(1)}% vs baseline ${(baselineMissingRate * 100).toFixed(1)}%.`,
    metricName: "missing_disposition_rate",
    baselineValue: baselineMissingRate,
    currentValue: currentMissingRate,
    deviationPct: missingDeviation * 100,
    threshold: 25,
  });

  // Low confidence rate
  const currentLowRate = currentPeriod.totalRecords > 0
    ? currentPeriod.lowConfidence / currentPeriod.totalRecords : 0;
  const baselineLowRate = baselinePeriod.totalRecords > 0
    ? baselinePeriod.lowConfidence / baselinePeriod.totalRecords : 0;

  const lowDeviation = baselineLowRate > 0
    ? (currentLowRate - baselineLowRate) / baselineLowRate : 0;

  results.push({
    type: "DATA_DRIFT",
    detected: lowDeviation > 0.25,
    severity: lowDeviation > 0.75 ? "HIGH" : lowDeviation > 0.5 ? "MEDIUM" : "LOW",
    title: "Low Identity Confidence Rate Increase",
    description: `Low-confidence identity matches: ${(currentLowRate * 100).toFixed(1)}% vs baseline ${(baselineLowRate * 100).toFixed(1)}%.`,
    metricName: "low_confidence_rate",
    baselineValue: baselineLowRate,
    currentValue: currentLowRate,
    deviationPct: lowDeviation * 100,
    threshold: 25,
  });

  return results;
}

/**
 * Check for disparity drift — fairness metrics crossing thresholds.
 */
export function checkDisparityDrift(
  currentImpactRatio: number,
  baselineImpactRatio: number,
  protectedClass: string
): DriftCheckResult {
  const deviation = baselineImpactRatio > 0
    ? (baselineImpactRatio - currentImpactRatio) / baselineImpactRatio : 0;

  const crossedThreshold = currentImpactRatio < 0.8 && baselineImpactRatio >= 0.8;

  return {
    type: "DISPARITY_DRIFT",
    detected: crossedThreshold || deviation > 0.1,
    severity: crossedThreshold ? "CRITICAL"
      : currentImpactRatio < 0.8 ? "HIGH"
      : deviation > 0.15 ? "MEDIUM"
      : "LOW",
    title: `Disparate Impact Drift: ${protectedClass}`,
    description: crossedThreshold
      ? `Impact ratio for ${protectedClass} has crossed the four-fifths threshold: ${currentImpactRatio.toFixed(3)} (was ${baselineImpactRatio.toFixed(3)}).`
      : `Impact ratio for ${protectedClass}: ${currentImpactRatio.toFixed(3)} (baseline: ${baselineImpactRatio.toFixed(3)}).`,
    metricName: `disparate_impact_${protectedClass}`,
    baselineValue: baselineImpactRatio,
    currentValue: currentImpactRatio,
    deviationPct: deviation * 100,
    threshold: 80, // four-fifths rule
  };
}
