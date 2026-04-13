// Spec §4.F — Protected classes under Fair Housing Act and state laws

export const FEDERAL_PROTECTED_CLASSES = [
  { key: "race", label: "Race", description: "Fair Housing Act, 42 U.S.C. § 3604" },
  { key: "color", label: "Color", description: "Fair Housing Act, 42 U.S.C. § 3604" },
  { key: "national_origin", label: "National Origin", description: "Fair Housing Act, 42 U.S.C. § 3604" },
  { key: "religion", label: "Religion", description: "Fair Housing Act, 42 U.S.C. § 3604" },
  { key: "sex", label: "Sex", description: "Fair Housing Act, 42 U.S.C. § 3604 (includes sexual orientation and gender identity per Bostock)" },
  { key: "familial_status", label: "Familial Status", description: "Fair Housing Act, 42 U.S.C. § 3604 (families with children under 18)" },
  { key: "disability", label: "Disability", description: "Fair Housing Act, 42 U.S.C. § 3604" },
] as const;

export const CALIFORNIA_ADDITIONAL_CLASSES = [
  { key: "source_of_income", label: "Source of Income", description: "CA FEHA - includes housing vouchers (Section 8, VASH, etc.)" },
  { key: "sexual_orientation", label: "Sexual Orientation", description: "CA FEHA" },
  { key: "gender_identity", label: "Gender Identity", description: "CA FEHA" },
  { key: "gender_expression", label: "Gender Expression", description: "CA FEHA" },
  { key: "marital_status", label: "Marital Status", description: "CA FEHA" },
  { key: "military_status", label: "Military/Veteran Status", description: "CA FEHA" },
  { key: "age", label: "Age", description: "CA FEHA" },
  { key: "immigration_status", label: "Immigration Status", description: "CA Civil Code § 1940.3" },
  { key: "primary_language", label: "Primary Language", description: "CA FEHA" },
] as const;

export const ALL_PROTECTED_CLASSES = [
  ...FEDERAL_PROTECTED_CLASSES,
  ...CALIFORNIA_ADDITIONAL_CLASSES,
] as const;

export const DEMOGRAPHIC_CATEGORIES: Record<string, string[]> = {
  race: ["White", "Black or African American", "Asian", "American Indian or Alaska Native", "Native Hawaiian or Pacific Islander", "Two or More Races", "Other"],
  ethnicity: ["Hispanic or Latino", "Not Hispanic or Latino"],
  sex: ["Male", "Female", "Non-binary", "Other", "Prefer not to say"],
  familialStatus: ["No children", "Has children under 18", "Pregnant", "Securing custody"],
  nationalOrigin: ["US Citizen", "Permanent Resident", "Other"],
  sourceOfIncome: ["Employment", "Section 8 Voucher", "VASH Voucher", "SSI/SSDI", "Retirement", "Other assistance", "Multiple sources"],
};
