// Spec §4.G, §4.H — Core Decision Engine
// Ties together policy (§4.A), records (§4.B), identity (§4.C),
// relevance (§4.D), proxy risk (§4.E), and jurisdiction (§4.M)
// to produce explainable, reviewable decisions

import type { PolicyRule, ScreeningRecord } from "@/generated/prisma/client";

export interface CriterionEvaluation {
  ruleId: string;
  ruleLabel: string;
  criterionType: string;
  passed: boolean;
  score: number;           // 0-100 for this criterion
  weight: number;
  isDisqualifying: boolean;
  evidence: string;        // What data drove this result
  recordIds: string[];     // Which records were evaluated
}

export interface DecisionResult {
  outcome: "APPROVED" | "DENIED" | "CONDITIONAL" | "PENDING_REVIEW";
  confidenceScore: number;  // 0-100
  overallScore: number;     // Weighted score across all criteria
  evaluations: CriterionEvaluation[];
  disqualifyingCriteria: string[];
  requiresHumanReview: boolean;
  reviewReasons: string[];
}

/**
 * Run the decision engine for an application.
 *
 * The engine evaluates each policy rule against relevant screening records,
 * computes weighted scores, and determines the outcome.
 * Auto-denial is reserved for narrow, clearly policy-matched, high-confidence cases.
 */
export function evaluateApplication(
  policyRules: PolicyRule[],
  records: ScreeningRecord[],
  options: {
    hasVoucher: boolean;
    hasAccommodationRequest: boolean;
    complianceMode: "FEDERAL_CA" | "COURT_ONLY";
  }
): DecisionResult {
  const evaluations: CriterionEvaluation[] = [];
  const disqualifyingCriteria: string[] = [];
  const reviewReasons: string[] = [];

  // Evaluate each active policy rule
  const activeRules = policyRules.filter((r) => r.isActive);

  for (const rule of activeRules) {
    const relevantRecords = records.filter(
      (r) => r.relevance === "RELEVANT" || r.relevance === "CONDITIONAL"
    );

    const evaluation = evaluateCriterion(rule, relevantRecords);
    evaluations.push(evaluation);

    if (!evaluation.passed && rule.isDisqualifying) {
      disqualifyingCriteria.push(rule.label);
    }
  }

  // Compute weighted overall score
  const totalWeight = evaluations.reduce((sum, e) => sum + e.weight, 0);
  const weightedScore = totalWeight > 0
    ? evaluations.reduce((sum, e) => sum + e.score * e.weight, 0) / totalWeight
    : 50;

  // Determine human review triggers (Spec §4.H)
  if (options.hasVoucher) {
    reviewReasons.push("Applicant has housing voucher — requires individualized review.");
  }
  if (options.hasAccommodationRequest) {
    reviewReasons.push("Applicant requested reasonable accommodation — requires review.");
  }
  if (records.some((r) => r.relevance === "CONDITIONAL")) {
    reviewReasons.push("One or more records have conditional relevance — requires review.");
  }
  if (records.some((r) => r.isQuarantined)) {
    reviewReasons.push("One or more records are quarantined due to low identity confidence.");
  }
  if (records.some((r) => r.recordType === "CRIMINAL_HISTORY")) {
    reviewReasons.push("Criminal history requires individualized assessment per HUD guidance (2016 OGC Memo)");
  }
  if (options.complianceMode === "FEDERAL_CA" && records.some((r) => r.recordType === "CRIMINAL_HISTORY")) {
    reviewReasons.push("Criminal history present — CA requires individualized assessment.");
  }

  // Edge cases near threshold get routed to review
  if (weightedScore >= 40 && weightedScore <= 60) {
    reviewReasons.push("Decision confidence is near threshold — human review recommended.");
  }

  const requiresHumanReview = reviewReasons.length > 0;

  // Determine outcome
  let outcome: DecisionResult["outcome"];
  let confidenceScore: number;

  if (disqualifyingCriteria.length > 0 && !requiresHumanReview) {
    outcome = "DENIED";
    confidenceScore = Math.min(95, 60 + disqualifyingCriteria.length * 10);
  } else if (requiresHumanReview) {
    outcome = "PENDING_REVIEW";
    confidenceScore = Math.max(30, weightedScore);
  } else if (weightedScore >= 70) {
    outcome = "APPROVED";
    confidenceScore = weightedScore;
  } else if (weightedScore >= 50) {
    outcome = "CONDITIONAL";
    confidenceScore = weightedScore;
  } else {
    outcome = "PENDING_REVIEW"; // Low scores always go to review
    confidenceScore = weightedScore;
  }

  return {
    outcome,
    confidenceScore,
    overallScore: weightedScore,
    evaluations,
    disqualifyingCriteria,
    requiresHumanReview,
    reviewReasons,
  };
}

/**
 * Evaluate a single policy criterion against screening records.
 */
function evaluateCriterion(
  rule: PolicyRule,
  records: ScreeningRecord[]
): CriterionEvaluation {
  const relevantRecords = records.filter((r) =>
    recordTypeMatchesRule(r.recordType, rule.criterionType)
  );

  if (relevantRecords.length === 0) {
    // No data for this criterion — assume pass (benefit of the doubt)
    return {
      ruleId: rule.id,
      ruleLabel: rule.label,
      criterionType: rule.criterionType,
      passed: true,
      score: 75, // Neutral-positive
      weight: rule.weight,
      isDisqualifying: rule.isDisqualifying,
      evidence: "No screening records found for this criterion.",
      recordIds: [],
    };
  }

  // Evaluate based on criterion type
  switch (rule.criterionType) {
    case "CREDIT_SCORE":
      return evaluateCreditScore(rule, relevantRecords);
    case "CRIMINAL_HISTORY":
      return evaluateCriminalHistory(rule, relevantRecords);
    case "EVICTION_HISTORY":
      return evaluateEvictionHistory(rule, relevantRecords);
    case "INCOME_REQUIREMENT":
      return evaluateIncomeRequirement(rule, relevantRecords);
    default:
      return evaluateGeneric(rule, relevantRecords);
  }
}

function evaluateCreditScore(rule: PolicyRule, records: ScreeningRecord[]): CriterionEvaluation {
  const creditRecord = records.find((r) => r.recordType === "CREDIT_REPORT");
  const normalizedData = creditRecord?.normalizedData as Record<string, unknown> | undefined;
  const creditScore = (normalizedData?.creditScore as number) ?? 0;
  const threshold = parseInt(rule.value) || 600;

  const passed = creditScore >= threshold;
  const score = passed ? Math.min(100, (creditScore / threshold) * 75) : Math.max(0, (creditScore / threshold) * 50);

  return {
    ruleId: rule.id,
    ruleLabel: rule.label,
    criterionType: rule.criterionType,
    passed,
    score,
    weight: rule.weight,
    isDisqualifying: rule.isDisqualifying,
    evidence: `Credit score: ${creditScore} (threshold: ${threshold})`,
    recordIds: creditRecord ? [creditRecord.id] : [],
  };
}

function evaluateCriminalHistory(rule: PolicyRule, records: ScreeningRecord[]): CriterionEvaluation {
  const criminalRecords = records.filter((r) => r.recordType === "CRIMINAL_HISTORY");
  const convictions = criminalRecords.filter((r) => {
    const d = r.disposition?.toLowerCase() ?? "";
    return d === "convicted" || d === "guilty" || d === "plea";
  });

  const passed = convictions.length === 0;
  const score = passed ? 100 : Math.max(0, 50 - convictions.length * 15);

  // HUD OGC Memo (2016): Criminal history must NEVER auto-disqualify.
  // Always route to human review for individualized assessment.
  return {
    ruleId: rule.id,
    ruleLabel: rule.label,
    criterionType: rule.criterionType,
    passed,
    score,
    weight: rule.weight,
    isDisqualifying: false, // Never auto-disqualify for criminal history per HUD guidance
    evidence: `${convictions.length} conviction(s) found out of ${criminalRecords.length} criminal record(s).`,
    recordIds: criminalRecords.map((r) => r.id),
  };
}

function evaluateEvictionHistory(rule: PolicyRule, records: ScreeningRecord[]): CriterionEvaluation {
  const evictionRecords = records.filter((r) => r.recordType === "EVICTION_HISTORY");
  const adverseEvictions = evictionRecords.filter((r) => {
    const d = r.disposition?.toLowerCase() ?? "";
    return d === "judgment_landlord" || d === "evicted" || d === "default";
  });

  const passed = adverseEvictions.length === 0;
  const score = passed ? 100 : Math.max(0, 50 - adverseEvictions.length * 20);

  return {
    ruleId: rule.id,
    ruleLabel: rule.label,
    criterionType: rule.criterionType,
    passed,
    score,
    weight: rule.weight,
    isDisqualifying: rule.isDisqualifying,
    evidence: `${adverseEvictions.length} adverse eviction(s) found out of ${evictionRecords.length} record(s).`,
    recordIds: evictionRecords.map((r) => r.id),
  };
}

function evaluateIncomeRequirement(rule: PolicyRule, records: ScreeningRecord[]): CriterionEvaluation {
  const incomeRecord = records.find((r) => r.recordType === "INCOME_VERIFICATION");
  const normalizedData = incomeRecord?.normalizedData as Record<string, unknown> | undefined;
  const monthlyIncome = (normalizedData?.monthlyIncome as number) ?? 0;
  const threshold = parseFloat(rule.value) || 0;

  const passed = monthlyIncome >= threshold;
  const score = passed ? Math.min(100, (monthlyIncome / Math.max(threshold, 1)) * 75) : Math.max(0, (monthlyIncome / Math.max(threshold, 1)) * 50);

  return {
    ruleId: rule.id,
    ruleLabel: rule.label,
    criterionType: rule.criterionType,
    passed,
    score,
    weight: rule.weight,
    isDisqualifying: rule.isDisqualifying,
    evidence: `Monthly income: $${monthlyIncome.toFixed(2)} (threshold: $${threshold.toFixed(2)})`,
    recordIds: incomeRecord ? [incomeRecord.id] : [],
  };
}

function evaluateGeneric(rule: PolicyRule, records: ScreeningRecord[]): CriterionEvaluation {
  return {
    ruleId: rule.id,
    ruleLabel: rule.label,
    criterionType: rule.criterionType,
    passed: true,
    score: 75,
    weight: rule.weight,
    isDisqualifying: rule.isDisqualifying,
    evidence: `${records.length} record(s) found. Manual review recommended.`,
    recordIds: records.map((r) => r.id),
  };
}

function recordTypeMatchesRule(recordType: string, criterionType: string): boolean {
  const mapping: Record<string, string[]> = {
    CREDIT_SCORE: ["CREDIT_REPORT"],
    CRIMINAL_HISTORY: ["CRIMINAL_HISTORY", "BACKGROUND_CHECK"],
    EVICTION_HISTORY: ["EVICTION_HISTORY"],
    INCOME_REQUIREMENT: ["INCOME_VERIFICATION"],
    RENTAL_HISTORY: ["RENTAL_HISTORY"],
    EMPLOYMENT_HISTORY: ["EMPLOYMENT_VERIFICATION"],
    DEBT_TO_INCOME: ["CREDIT_REPORT", "INCOME_VERIFICATION"],
    SOURCE_OF_INCOME: ["INCOME_VERIFICATION"],
    CUSTOM: [],
  };
  return mapping[criterionType]?.includes(recordType) ?? false;
}
