// Spec §4.A — Standard screening criteria types and operators

export const CRITERION_TYPES = [
  { value: "CRIMINAL_HISTORY", label: "Criminal History", description: "Conviction and arrest records" },
  { value: "CREDIT_SCORE", label: "Credit Score", description: "Consumer credit score threshold" },
  { value: "EVICTION_HISTORY", label: "Eviction History", description: "Prior eviction filings and judgments" },
  { value: "INCOME_REQUIREMENT", label: "Income Requirement", description: "Minimum income or income-to-rent ratio" },
  { value: "RENTAL_HISTORY", label: "Rental History", description: "Prior landlord references and payment history" },
  { value: "EMPLOYMENT_HISTORY", label: "Employment History", description: "Employment verification and duration" },
  { value: "DEBT_TO_INCOME", label: "Debt-to-Income Ratio", description: "Monthly debt obligations vs. income" },
  { value: "SOURCE_OF_INCOME", label: "Source of Income", description: "How applicant pays rent (employment, voucher, etc.)" },
  { value: "CUSTOM", label: "Custom Criterion", description: "Property-specific screening criterion" },
] as const;

export const OPERATORS = [
  { value: "GT", label: "Greater than" },
  { value: "GTE", label: "Greater than or equal" },
  { value: "LT", label: "Less than" },
  { value: "LTE", label: "Less than or equal" },
  { value: "EQ", label: "Equals" },
  { value: "NEQ", label: "Not equal" },
  { value: "BETWEEN", label: "Between" },
  { value: "CONTAINS", label: "Contains" },
  { value: "NOT_CONTAINS", label: "Does not contain" },
  { value: "LOOKBACK_YEARS", label: "Lookback period (years)" },
  { value: "LOOKBACK_MONTHS", label: "Lookback period (months)" },
  { value: "MAX_COUNT", label: "Maximum count" },
  { value: "BOOLEAN", label: "Yes/No" },
] as const;

export const DEFAULT_LOOKBACK_MONTHS: Record<string, number> = {
  CRIMINAL_HISTORY: 84,  // 7 years per FCRA
  CREDIT_SCORE: 0,       // Current
  EVICTION_HISTORY: 84,  // 7 years per FCRA
  INCOME_REQUIREMENT: 0, // Current
  RENTAL_HISTORY: 60,    // 5 years typical
  EMPLOYMENT_HISTORY: 24, // 2 years typical
  DEBT_TO_INCOME: 0,     // Current
};
