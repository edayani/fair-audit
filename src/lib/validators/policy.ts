// Spec §4.A — Policy Configuration Validators
import { z } from "zod/v4";

export const CriterionTypeEnum = z.enum([
  "CRIMINAL_HISTORY", "CREDIT_SCORE", "EVICTION_HISTORY",
  "INCOME_REQUIREMENT", "RENTAL_HISTORY", "EMPLOYMENT_HISTORY",
  "DEBT_TO_INCOME", "SOURCE_OF_INCOME", "CUSTOM",
]);

export const PolicyRuleSchema = z.object({
  criterionType: CriterionTypeEnum,
  label: z.string().min(1, "Rule label is required"),
  description: z.string().optional(),
  operator: z.string().min(1, "Operator is required"),
  value: z.string().min(1, "Threshold value is required"),
  weight: z.number().min(0).max(10).default(1.0),
  isDisqualifying: z.boolean().default(false),
  lookbackMonths: z.number().int().positive().nullable().optional(),
  waiverConditions: z.string().nullable().optional(),
  mitigationAllowed: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const CreatePolicySchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  name: z.string().min(1, "Policy name is required"),
  jurisdictionId: z.string().optional(),
  rules: z.array(PolicyRuleSchema).min(1, "At least one rule is required"),
});

export const UpdatePolicySchema = CreatePolicySchema.partial().extend({
  id: z.string().min(1),
});

export type PolicyRuleInput = z.infer<typeof PolicyRuleSchema>;
export type CreatePolicyInput = z.infer<typeof CreatePolicySchema>;
