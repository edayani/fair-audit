// Spec §4.M — Jurisdiction Validators
import { z } from "zod/v4";

export const JurisdictionLevelEnum = z.enum(["FEDERAL", "STATE", "LOCAL"]);

export const CreateJurisdictionSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(10),
  level: JurisdictionLevelEnum,
  parentId: z.string().optional(),
});

export const CreateJurisdictionRuleSchema = z.object({
  jurisdictionId: z.string().min(1),
  category: z.string().min(1),
  ruleKey: z.string().min(1),
  ruleText: z.string().min(1),
  ruleData: z.record(z.string(), z.unknown()).optional(),
  effectiveDate: z.string(),
  expirationDate: z.string().optional(),
});

export const ComplianceModeSchema = z.object({
  mode: z.enum(["FEDERAL_CA", "COURT_ONLY"]),
  disclaimerAcknowledged: z.boolean().optional(),
});

export type CreateJurisdictionInput = z.infer<typeof CreateJurisdictionSchema>;
export type CreateJurisdictionRuleInput = z.infer<typeof CreateJurisdictionRuleSchema>;
export type ComplianceModeInput = z.infer<typeof ComplianceModeSchema>;
