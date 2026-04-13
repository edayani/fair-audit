// Spec §4.G — Explainability & Reason-Code Engine
// Converts decision evaluations into human-readable, FCRA-compliant reason codes
// HUD: denial letters should include the specific standard not met, how the applicant
// fell short, and all records relied on

import type { CriterionEvaluation } from "./decision";

export interface GeneratedReasonCode {
  code: string;         // e.g., "CR-001"
  category: string;     // Credit, Criminal, Eviction, Income, etc.
  shortText: string;    // Brief reason for notice (FCRA-compliant)
  detailedText: string; // Full explanation
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  policyRuleId: string;
  recordIds: string[];
}

/** Standard reason code catalog per FCRA */
const REASON_CODE_CATALOG: Record<string, { code: string; shortText: string }> = {
  "CREDIT_SCORE_LOW":     { code: "CR-001", shortText: "Credit score below minimum threshold" },
  "CREDIT_DEROGATORY":    { code: "CR-002", shortText: "Derogatory marks on credit report" },
  "CREDIT_INSUFFICIENT":  { code: "CR-003", shortText: "Insufficient credit history" },
  "CRIMINAL_CONVICTION":  { code: "CM-001", shortText: "Criminal conviction within lookback period" },
  "CRIMINAL_PENDING":     { code: "CM-002", shortText: "Pending criminal charges" },
  "EVICTION_JUDGMENT":    { code: "EV-001", shortText: "Eviction judgment against applicant" },
  "EVICTION_FILING":      { code: "EV-002", shortText: "Eviction filing within lookback period" },
  "INCOME_INSUFFICIENT":  { code: "IN-001", shortText: "Income below minimum requirement" },
  "INCOME_UNVERIFIED":    { code: "IN-002", shortText: "Unable to verify income" },
  "RENTAL_NEGATIVE":      { code: "RH-001", shortText: "Negative rental history reported" },
  "RENTAL_INSUFFICIENT":  { code: "RH-002", shortText: "Insufficient rental history" },
  "EMPLOYMENT_UNVERIFIED":{ code: "EM-001", shortText: "Unable to verify employment" },
  "DTI_HIGH":             { code: "DT-001", shortText: "Debt-to-income ratio exceeds threshold" },
  "GENERAL_POLICY":       { code: "GN-001", shortText: "Did not meet screening policy requirements" },
};

/**
 * Generate reason codes from decision evaluations.
 * Returns up to 4 reason codes per FCRA requirements, ordered by severity.
 */
export function generateReasonCodes(
  evaluations: CriterionEvaluation[]
): GeneratedReasonCode[] {
  const failedEvaluations = evaluations
    .filter((e) => !e.passed)
    .sort((a, b) => {
      // Disqualifying first, then by score (lowest first)
      if (a.isDisqualifying !== b.isDisqualifying) return a.isDisqualifying ? -1 : 1;
      return a.score - b.score;
    });

  const reasonCodes: GeneratedReasonCode[] = failedEvaluations.map((evaluation) => {
    const catalogEntry = findCatalogEntry(evaluation);
    const severity = getSeverity(evaluation);

    return {
      code: catalogEntry.code,
      category: getCategoryLabel(evaluation.criterionType),
      shortText: catalogEntry.shortText,
      detailedText: buildDetailedText(evaluation),
      severity,
      policyRuleId: evaluation.ruleId,
      recordIds: evaluation.recordIds,
    };
  });

  // FCRA: max 4 reason codes on adverse action notice
  return reasonCodes.slice(0, 4);
}

function findCatalogEntry(evaluation: CriterionEvaluation): { code: string; shortText: string } {
  switch (evaluation.criterionType) {
    case "CREDIT_SCORE":
      return REASON_CODE_CATALOG.CREDIT_SCORE_LOW;
    case "CRIMINAL_HISTORY":
      return REASON_CODE_CATALOG.CRIMINAL_CONVICTION;
    case "EVICTION_HISTORY":
      return evaluation.evidence.includes("judgment")
        ? REASON_CODE_CATALOG.EVICTION_JUDGMENT
        : REASON_CODE_CATALOG.EVICTION_FILING;
    case "INCOME_REQUIREMENT":
      return REASON_CODE_CATALOG.INCOME_INSUFFICIENT;
    case "RENTAL_HISTORY":
      return REASON_CODE_CATALOG.RENTAL_NEGATIVE;
    case "EMPLOYMENT_HISTORY":
      return REASON_CODE_CATALOG.EMPLOYMENT_UNVERIFIED;
    case "DEBT_TO_INCOME":
      return REASON_CODE_CATALOG.DTI_HIGH;
    default:
      return REASON_CODE_CATALOG.GENERAL_POLICY;
  }
}

function getSeverity(evaluation: CriterionEvaluation): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (evaluation.isDisqualifying) return "CRITICAL";
  if (evaluation.score < 25) return "HIGH";
  if (evaluation.score < 50) return "MEDIUM";
  return "LOW";
}

function getCategoryLabel(criterionType: string): string {
  const labels: Record<string, string> = {
    CREDIT_SCORE: "Credit",
    CRIMINAL_HISTORY: "Criminal Background",
    EVICTION_HISTORY: "Eviction History",
    INCOME_REQUIREMENT: "Income",
    RENTAL_HISTORY: "Rental History",
    EMPLOYMENT_HISTORY: "Employment",
    DEBT_TO_INCOME: "Debt-to-Income",
    SOURCE_OF_INCOME: "Source of Income",
    CUSTOM: "Other",
  };
  return labels[criterionType] ?? "General";
}

function buildDetailedText(evaluation: CriterionEvaluation): string {
  return (
    `The application did not meet the screening criterion "${evaluation.ruleLabel}". ` +
    `${evaluation.evidence} ` +
    `This criterion has a weight of ${evaluation.weight.toFixed(1)} in the overall evaluation` +
    (evaluation.isDisqualifying ? " and is a disqualifying factor" : "") +
    "."
  );
}
