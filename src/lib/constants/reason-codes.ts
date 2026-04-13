// Spec §4.G — Standard FCRA Adverse Action Reason Codes
// These are the standard codes used in adverse action notices

export const REASON_CODE_CATALOG = {
  // Credit-related
  "CR-001": { category: "Credit", shortText: "Credit score below minimum threshold", severity: "HIGH" as const },
  "CR-002": { category: "Credit", shortText: "Derogatory marks on credit report", severity: "MEDIUM" as const },
  "CR-003": { category: "Credit", shortText: "Insufficient credit history", severity: "MEDIUM" as const },
  "CR-004": { category: "Credit", shortText: "High credit utilization ratio", severity: "MEDIUM" as const },
  "CR-005": { category: "Credit", shortText: "Recent late payments", severity: "MEDIUM" as const },
  "CR-006": { category: "Credit", shortText: "Accounts in collections", severity: "HIGH" as const },

  // Criminal history
  "CM-001": { category: "Criminal", shortText: "Criminal conviction within lookback period", severity: "HIGH" as const },
  "CM-002": { category: "Criminal", shortText: "Pending criminal charges", severity: "MEDIUM" as const },
  "CM-003": { category: "Criminal", shortText: "Sex offender registry match", severity: "CRITICAL" as const },

  // Eviction history
  "EV-001": { category: "Eviction", shortText: "Eviction judgment against applicant", severity: "HIGH" as const },
  "EV-002": { category: "Eviction", shortText: "Eviction filing within lookback period", severity: "MEDIUM" as const },
  "EV-003": { category: "Eviction", shortText: "Multiple eviction filings", severity: "HIGH" as const },

  // Income
  "IN-001": { category: "Income", shortText: "Income below minimum requirement", severity: "HIGH" as const },
  "IN-002": { category: "Income", shortText: "Unable to verify income", severity: "MEDIUM" as const },
  "IN-003": { category: "Income", shortText: "Debt-to-income ratio exceeds threshold", severity: "MEDIUM" as const },

  // Rental history
  "RH-001": { category: "Rental", shortText: "Negative rental reference", severity: "MEDIUM" as const },
  "RH-002": { category: "Rental", shortText: "Insufficient rental history", severity: "LOW" as const },
  "RH-003": { category: "Rental", shortText: "Prior lease violation", severity: "MEDIUM" as const },

  // Employment
  "EM-001": { category: "Employment", shortText: "Unable to verify employment", severity: "MEDIUM" as const },
  "EM-002": { category: "Employment", shortText: "Employment duration below threshold", severity: "LOW" as const },

  // General
  "GN-001": { category: "General", shortText: "Did not meet screening policy requirements", severity: "MEDIUM" as const },
  "GN-002": { category: "General", shortText: "Incomplete application", severity: "LOW" as const },
} as const;

export type ReasonCodeKey = keyof typeof REASON_CODE_CATALOG;
