// LLM request/response types

export interface ParsedPolicyRule {
  criterionType: string;
  label: string;
  operator: string;
  value: string;
  isDisqualifying: boolean;
  lookbackMonths: number | null;
  mitigationAllowed: boolean;
  waiverConditions: string | null;
}

export interface LLMReasonCode {
  code: string;
  shortText: string;
  detailedText: string;
}

export interface LLMProxyAnalysis {
  features: Array<{
    featureName: string;
    proxyRiskScore: number;
    isProxy: boolean;
    proxyFor: string | null;
    explanation: string;
  }>;
  interactionEffects: Array<{
    features: string[];
    risk: string;
    explanation: string;
  }>;
}
