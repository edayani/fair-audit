// Spec §4.M — Jurisdiction & Rules Engine
// Resolves federal + state + local rule overlays
// Most protective rule wins when there are conflicts

import type { Jurisdiction, JurisdictionRule } from "@/generated/prisma/client";

export interface ResolvedRuleSet {
  jurisdictions: { id: string; name: string; level: string }[];
  protectedClasses: string[];
  criminalHistoryRules: CriminalHistoryRules;
  sourceOfIncomeProtected: boolean;
  noticeRequirements: NoticeRequirements;
  lookbackLimits: Record<string, number>;
  specialRules: Record<string, string>;
}

export interface CriminalHistoryRules {
  requiresIndividualizedAssessment: boolean;
  lookbackYears: number | null;
  excludedOffenseTypes: string[];
  autoRejectProhibited: boolean;
}

export interface NoticeRequirements {
  preAdverseRequired: boolean;
  preAdverseWaitDays: number;
  freeReportDays: number;
  disputeResponseDays: number;
}

// Federal FHA protected classes
const FEDERAL_PROTECTED_CLASSES = [
  "race", "color", "national_origin", "religion", "sex", "familial_status", "disability"
];

// California additions
const CALIFORNIA_PROTECTED_CLASSES = [
  ...FEDERAL_PROTECTED_CLASSES,
  "source_of_income", "sexual_orientation", "gender_identity",
  "gender_expression", "marital_status", "military_status",
  "immigration_status", "primary_language", "age",
];

/**
 * Resolve the effective rule set for a property based on its jurisdiction stack.
 * Federal + state + local rules are layered, most protective wins.
 */
export function resolveJurisdictionRules(
  jurisdictions: (Jurisdiction & { rules: JurisdictionRule[] })[],
  complianceMode: "FEDERAL_CA" | "COURT_ONLY"
): ResolvedRuleSet {
  // Start with federal baseline
  let protectedClasses = [...FEDERAL_PROTECTED_CLASSES];
  let criminalHistoryRules: CriminalHistoryRules = {
    requiresIndividualizedAssessment: true, // HUD recommends this
    lookbackYears: null,
    excludedOffenseTypes: [],
    autoRejectProhibited: false,
  };
  let sourceOfIncomeProtected = false;
  let noticeRequirements: NoticeRequirements = {
    preAdverseRequired: true,    // FCRA baseline
    preAdverseWaitDays: 5,
    freeReportDays: 60,
    disputeResponseDays: 30,
  };
  const lookbackLimits: Record<string, number> = {};
  const specialRules: Record<string, string> = {};

  // Sort jurisdictions by level: federal -> state -> local (most specific last)
  const sorted = [...jurisdictions].sort((a, b) => {
    const order = { FEDERAL: 0, STATE: 1, LOCAL: 2 };
    return (order[a.level] ?? 0) - (order[b.level] ?? 0);
  });

  for (const jurisdiction of sorted) {
    for (const rule of jurisdiction.rules) {
      switch (rule.category) {
        case "protected_classes": {
          const classes = (rule.ruleData as { classes?: string[] })?.classes ?? [];
          protectedClasses = [...new Set([...protectedClasses, ...classes])];
          break;
        }
        case "criminal_history": {
          const data = rule.ruleData as Record<string, unknown> ?? {};
          if (data.requiresIndividualizedAssessment) {
            criminalHistoryRules.requiresIndividualizedAssessment = true;
          }
          if (data.autoRejectProhibited) {
            criminalHistoryRules.autoRejectProhibited = true;
          }
          if (typeof data.lookbackYears === "number") {
            criminalHistoryRules.lookbackYears = criminalHistoryRules.lookbackYears
              ? Math.min(criminalHistoryRules.lookbackYears, data.lookbackYears)
              : data.lookbackYears;
          }
          if (Array.isArray(data.excludedOffenseTypes)) {
            criminalHistoryRules.excludedOffenseTypes = [
              ...new Set([...criminalHistoryRules.excludedOffenseTypes, ...data.excludedOffenseTypes as string[]]),
            ];
          }
          break;
        }
        case "source_of_income": {
          sourceOfIncomeProtected = true;
          break;
        }
        case "notice_requirements": {
          const data = rule.ruleData as Record<string, unknown> ?? {};
          if (typeof data.preAdverseWaitDays === "number") {
            noticeRequirements.preAdverseWaitDays = Math.max(
              noticeRequirements.preAdverseWaitDays,
              data.preAdverseWaitDays
            );
          }
          if (typeof data.disputeResponseDays === "number") {
            noticeRequirements.disputeResponseDays = Math.min(
              noticeRequirements.disputeResponseDays,
              data.disputeResponseDays
            );
          }
          break;
        }
        case "lookback_limits": {
          const data = rule.ruleData as Record<string, number> ?? {};
          for (const [key, val] of Object.entries(data)) {
            lookbackLimits[key] = lookbackLimits[key]
              ? Math.min(lookbackLimits[key], val)
              : val;
          }
          break;
        }
        default: {
          specialRules[rule.ruleKey] = rule.ruleText;
        }
      }
    }
  }

  // Apply California defaults if in FEDERAL_CA mode
  if (complianceMode === "FEDERAL_CA") {
    protectedClasses = [...new Set([...CALIFORNIA_PROTECTED_CLASSES, ...protectedClasses])];
    sourceOfIncomeProtected = true;
    criminalHistoryRules.requiresIndividualizedAssessment = true;
    criminalHistoryRules.autoRejectProhibited = true;
  }

  // Court-Only mode: narrower disparate impact standard
  if (complianceMode === "COURT_ONLY") {
    specialRules["disparate_impact_standard"] =
      "Using court-defined disparate impact standard only. " +
      "Disclaimer: The Jan 2026 HUD proposed rule would remove codified discriminatory-effects regulations. " +
      "This mode applies only the Supreme Court's narrower standard from Texas Dept. of Housing v. Inclusive Communities (2015).";
  }

  return {
    jurisdictions: sorted.map((j) => ({ id: j.id, name: j.name, level: j.level })),
    protectedClasses,
    criminalHistoryRules,
    sourceOfIncomeProtected,
    noticeRequirements,
    lookbackLimits,
    specialRules,
  };
}
