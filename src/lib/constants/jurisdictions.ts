// Spec §4.M — Pre-configured jurisdiction rules

export const FEDERAL_RULES = {
  name: "Federal FHA",
  code: "FED",
  level: "FEDERAL" as const,
  rules: [
    {
      category: "protected_classes",
      ruleKey: "fha_protected_classes",
      ruleText: "Fair Housing Act protected classes: race, color, national origin, religion, sex, familial status, disability",
      ruleData: {
        classes: ["race", "color", "national_origin", "religion", "sex", "familial_status", "disability"],
      },
      effectiveDate: "1968-04-11",
    },
    {
      category: "notice_requirements",
      ruleKey: "fcra_adverse_action",
      ruleText: "FCRA requires adverse action notice with CRA info, right to free report within 60 days, right to dispute",
      ruleData: {
        preAdverseRequired: true,
        preAdverseWaitDays: 5,
        freeReportDays: 60,
        disputeResponseDays: 30,
      },
      effectiveDate: "2003-12-04",
    },
    {
      category: "criminal_history",
      ruleKey: "hud_criminal_guidance",
      ruleText: "HUD 2024 guidance: screening should focus on tenancy-relevant information, require individualized assessment for criminal history, not use arrests without conviction",
      ruleData: {
        requiresIndividualizedAssessment: true,
        autoRejectProhibited: false,
        excludedOffenseTypes: ["arrest_only", "dismissed", "acquitted", "expunged", "sealed"],
      },
      effectiveDate: "2024-04-01",
    },
  ],
};

export const CALIFORNIA_RULES = {
  name: "California",
  code: "CA",
  level: "STATE" as const,
  rules: [
    {
      category: "protected_classes",
      ruleKey: "feha_protected_classes",
      ruleText: "FEHA additional protected classes: source of income (incl. vouchers), sexual orientation, gender identity, marital status, military status, age, immigration status",
      ruleData: {
        classes: ["source_of_income", "sexual_orientation", "gender_identity", "gender_expression", "marital_status", "military_status", "age", "immigration_status", "primary_language"],
      },
      effectiveDate: "1959-09-18",
    },
    {
      category: "source_of_income",
      ruleKey: "ca_soi_protection",
      ruleText: "CA prohibits rejection based on use of housing voucher/subsidy. Must consider tenant portion of rent rather than full credit history when applicant provides verifiable evidence of ability to pay.",
      ruleData: {
        voucherProtected: true,
        considerTenantPortion: true,
        effectiveDate: "2024-01-01",
      },
      effectiveDate: "2020-01-01",
    },
    {
      category: "criminal_history",
      ruleKey: "ca_criminal_history",
      ruleText: "California requires individualized assessment of criminal history with documented link between offense and tenancy suitability. Automatic rejections based on criminal history are prohibited.",
      ruleData: {
        requiresIndividualizedAssessment: true,
        autoRejectProhibited: true,
        lookbackYears: 7,
        excludedOffenseTypes: ["arrest_only", "dismissed", "acquitted", "expunged", "sealed", "marijuana_prior_2018"],
      },
      effectiveDate: "2018-01-01",
    },
  ],
};

export const COMPLIANCE_MODE_DESCRIPTIONS = {
  FEDERAL_CA: {
    label: "Federal + California",
    description: "Applies the federal Fair Housing Act together with California's Fair Employment and Housing Act (FEHA), including source-of-income protection and the Civil Rights Council's criminal-history regulations. The most protective standard; recommended.",
    isDefault: true,
  },
  COURT_ONLY: {
    label: "Judicial disparate-impact standard only",
    description: "Evaluates discriminatory effects solely under the standard articulated in Texas Dep't of Housing & Community Affairs v. Inclusive Communities Project, Inc., 576 U.S. 519 (2015) — including its robust-causality requirement — without relying on agency regulations.",
    disclaimer: "Federal regulatory standards for discriminatory effects (24 C.F.R. § 100.500) have been the subject of repeated rulemaking and litigation. This mode applies only the judicially recognized standard, which may afford applicants less protection than the regulatory framework or state law. State-law obligations continue to apply regardless of this setting. Consult counsel before selecting it.",
    isDefault: false,
  },
};
