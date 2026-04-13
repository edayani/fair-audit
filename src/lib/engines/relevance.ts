// Spec §4.D — Relevance-to-Tenancy Engine
// HUD: screening should focus on information relevant to whether the applicant
// will comply with tenancy obligations, not general "riskiness"

import type { PolicyRule, ScreeningRecord } from "@/generated/prisma/client";

export interface RelevanceLabelResult {
  recordId: string;
  label: "RELEVANT" | "IRRELEVANT" | "CONDITIONAL" | "PROHIBITED";
  reason: string;
  policyRuleId?: string;
}

/**
 * Determine the relevance of a screening record to the tenancy decision.
 * Evaluates against the property's screening policy rules.
 */
export function labelRecordRelevance(
  record: ScreeningRecord,
  policyRules: PolicyRule[]
): RelevanceLabelResult {
  // Sealed/expunged records are always irrelevant
  if (record.isSealed || record.isExpunged) {
    return {
      recordId: record.id,
      label: "IRRELEVANT",
      reason: "Record is sealed or expunged and cannot be used in screening decisions.",
    };
  }

  // Records without a clear disposition — HUD says disregard
  if (!record.hasDisposition) {
    return {
      recordId: record.id,
      label: "IRRELEVANT",
      reason: "Record lacks a clear disposition. Per HUD guidance, unclear outcomes should be disregarded.",
    };
  }

  // Find matching policy rules for this record type
  const matchingRules = policyRules.filter((rule) => {
    return recordTypeMatchesCriterion(record.recordType, rule.criterionType);
  });

  // No matching policy rules — record is not part of screening criteria
  if (matchingRules.length === 0) {
    return {
      recordId: record.id,
      label: "IRRELEVANT",
      reason: "No screening policy criterion matches this record type.",
    };
  }

  // Check lookback period
  for (const rule of matchingRules) {
    if (rule.lookbackMonths && record.dateOccurred) {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - rule.lookbackMonths);
      if (new Date(record.dateOccurred) < cutoff) {
        return {
          recordId: record.id,
          label: "IRRELEVANT",
          reason: `Record is older than the ${rule.lookbackMonths}-month lookback period for "${rule.label}".`,
          policyRuleId: rule.id,
        };
      }
    }
  }

  // Check disposition — dismissed/acquitted evictions are irrelevant per HUD
  if (record.recordType === "EVICTION_HISTORY") {
    const disposition = record.disposition?.toLowerCase() ?? "";
    if (["dismissed", "withdrawn", "tenant_prevailed", "won"].includes(disposition)) {
      return {
        recordId: record.id,
        label: "IRRELEVANT",
        reason: "Eviction was dismissed or tenant prevailed. Per HUD, this is not relevant.",
      };
    }
  }

  // Check criminal records — dismissed charges are irrelevant
  if (record.recordType === "CRIMINAL_HISTORY") {
    const disposition = record.disposition?.toLowerCase() ?? "";
    if (["dismissed", "acquitted", "not_guilty", "nolle_prosequi"].includes(disposition)) {
      return {
        recordId: record.id,
        label: "IRRELEVANT",
        reason: "Criminal charge was dismissed or resulted in acquittal.",
      };
    }

    // Arrests without conviction — conditional at best
    if (disposition === "arrested" || disposition === "pending") {
      return {
        recordId: record.id,
        label: "CONDITIONAL",
        reason: "Arrest/pending charge without conviction. Requires individualized assessment.",
      };
    }
  }

  // Check if mitigating evidence might apply
  const primaryRule = matchingRules[0];
  if (primaryRule.mitigationAllowed) {
    // Records with waiver conditions are conditional
    if (primaryRule.waiverConditions) {
      return {
        recordId: record.id,
        label: "CONDITIONAL",
        reason: `Record meets policy criterion "${primaryRule.label}" but mitigation may apply: ${primaryRule.waiverConditions}`,
        policyRuleId: primaryRule.id,
      };
    }
  }

  // Record matches active policy criterion and is within lookback
  return {
    recordId: record.id,
    label: "RELEVANT",
    reason: `Record is relevant to policy criterion "${primaryRule.label}".`,
    policyRuleId: primaryRule.id,
  };
}

/** Map record types to criterion types */
function recordTypeMatchesCriterion(recordType: string, criterionType: string): boolean {
  const mapping: Record<string, string[]> = {
    CRIMINAL_HISTORY: ["CRIMINAL_HISTORY"],
    CREDIT_REPORT: ["CREDIT_SCORE", "DEBT_TO_INCOME"],
    EVICTION_HISTORY: ["EVICTION_HISTORY"],
    EMPLOYMENT_VERIFICATION: ["EMPLOYMENT_HISTORY"],
    RENTAL_HISTORY: ["RENTAL_HISTORY"],
    INCOME_VERIFICATION: ["INCOME_REQUIREMENT", "SOURCE_OF_INCOME", "DEBT_TO_INCOME"],
    BACKGROUND_CHECK: ["CRIMINAL_HISTORY"],
    IDENTITY_VERIFICATION: [],
  };
  return mapping[recordType]?.includes(criterionType) ?? false;
}

/**
 * California-specific relevance adjustments (Spec §4.M)
 * Applied when organization is in FEDERAL_CA compliance mode.
 */
export function applyCaliforniaRelevanceRules(
  result: RelevanceLabelResult,
  record: ScreeningRecord,
  hasVoucher: boolean
): RelevanceLabelResult {
  // CA: Criminal history requires individualized assessment — never auto-deny
  if (record.recordType === "CRIMINAL_HISTORY" && result.label === "RELEVANT") {
    return {
      ...result,
      label: "CONDITIONAL",
      reason: result.reason + " California law requires individualized assessment of criminal history.",
    };
  }

  // CA: Source of income protection — cannot reject based on voucher use
  if (hasVoucher && record.recordType === "CREDIT_REPORT") {
    const normalizedData = record.normalizedData as Record<string, unknown>;
    const creditScore = normalizedData.creditScore as number | undefined;
    // If credit is the only issue and applicant has voucher, flag as conditional
    if (creditScore && creditScore < 650) {
      return {
        ...result,
        label: "CONDITIONAL",
        reason: result.reason + " Voucher holder: CA requires considering tenant portion of rent, not full credit history.",
      };
    }
  }

  return result;
}
