// Spec §4.E — Proxy-Risk & Feature Governance Engine
// HUD: check inputs for protected characteristics and their close proxies,
// and whether protected characteristics are being recreated by constellations of factors

export interface ProxyRiskResult {
  featureName: string;
  riskScore: number;   // 0-1
  isProxy: boolean;
  proxyFor: string | null;
  explanation: string;
}

/**
 * Known proxy risk mappings.
 * These are pre-coded high-correlation features per HUD guidance.
 * HUD specifically cites ZIP code as a proxy highly correlated with race.
 */
const KNOWN_PROXY_RISKS: Record<string, { proxyFor: string; baseRisk: number; explanation: string }> = {
  zip_code: {
    proxyFor: "race, national_origin",
    baseRisk: 0.85,
    explanation: "ZIP code is highly correlated with race and national origin. HUD explicitly identifies geographic proxies as a fair housing concern.",
  },
  neighborhood_score: {
    proxyFor: "race, national_origin",
    baseRisk: 0.80,
    explanation: "Neighborhood-level scoring typically reflects racial and ethnic composition of geographic areas.",
  },
  school_district: {
    proxyFor: "race, familial_status",
    baseRisk: 0.70,
    explanation: "School district quality scores correlate with racial composition and may disadvantage families with children.",
  },
  language_preference: {
    proxyFor: "national_origin",
    baseRisk: 0.90,
    explanation: "Language preference is a direct indicator of national origin.",
  },
  surname_analysis: {
    proxyFor: "race, national_origin",
    baseRisk: 0.95,
    explanation: "Surname-based analysis directly proxies for race and national origin.",
  },
  household_size: {
    proxyFor: "familial_status",
    baseRisk: 0.75,
    explanation: "Household size strongly correlates with familial status (presence of children).",
  },
  social_media_activity: {
    proxyFor: "religion, national_origin, disability",
    baseRisk: 0.65,
    explanation: "Social media data may reveal religion, national origin, disability status, and other protected characteristics.",
  },
  medical_debt: {
    proxyFor: "disability",
    baseRisk: 0.70,
    explanation: "Medical debt disproportionately affects people with disabilities and may serve as a proxy.",
  },
  student_loan_debt: {
    proxyFor: "race, national_origin",
    baseRisk: 0.55,
    explanation: "Student loan debt burden has documented disparate impact by race.",
  },
  source_of_income: {
    proxyFor: "race, disability, familial_status",
    baseRisk: 0.80,
    explanation: "Source of income (especially voucher status) correlates with race, disability, and familial status.",
  },
};

/**
 * Evaluate a feature for proxy risk using pre-coded rules.
 */
export function evaluateProxyRisk(featureName: string): ProxyRiskResult {
  const normalized = featureName.toLowerCase().replace(/\s+/g, "_");
  const known = KNOWN_PROXY_RISKS[normalized];

  if (known) {
    return {
      featureName,
      riskScore: known.baseRisk,
      isProxy: known.baseRisk >= 0.6,
      proxyFor: known.proxyFor,
      explanation: known.explanation,
    };
  }

  // Check for partial matches
  for (const [key, value] of Object.entries(KNOWN_PROXY_RISKS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return {
        featureName,
        riskScore: value.baseRisk * 0.7,
        isProxy: value.baseRisk * 0.7 >= 0.6,
        proxyFor: value.proxyFor,
        explanation: `Partial match with known proxy "${key}": ${value.explanation}`,
      };
    }
  }

  // Unknown features get a low default risk
  return {
    featureName,
    riskScore: 0.1,
    isProxy: false,
    proxyFor: null,
    explanation: "No known proxy risk identified for this feature.",
  };
}

/**
 * Evaluate a batch of features for proxy risk.
 */
export function evaluateFeatureBatch(featureNames: string[]): ProxyRiskResult[] {
  return featureNames.map(evaluateProxyRisk);
}

/**
 * Check for interaction effects — constellations of features that
 * may recreate protected-group separation even after explicit
 * demographic variables are removed.
 */
export function checkInteractionEffects(
  featureNames: string[]
): { detected: boolean; warning: string } {
  const geoFeatures = featureNames.filter((f) =>
    ["zip_code", "neighborhood", "census_tract", "county", "school_district"].some((g) =>
      f.toLowerCase().includes(g)
    )
  );

  const financialFeatures = featureNames.filter((f) =>
    ["income", "debt", "credit", "employment"].some((g) =>
      f.toLowerCase().includes(g)
    )
  );

  if (geoFeatures.length > 0 && financialFeatures.length > 0) {
    return {
      detected: true,
      warning:
        `Combination of geographic features (${geoFeatures.join(", ")}) with financial features ` +
        `(${financialFeatures.join(", ")}) may recreate protected-class separation. ` +
        "HUD warns that constellations of factors can reproduce discriminatory outcomes.",
    };
  }

  return { detected: false, warning: "" };
}
