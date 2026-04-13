// Spec §4.B — Data Ingestion Validators
import { z } from "zod/v4";

export const RecordTypeEnum = z.enum([
  "CREDIT_REPORT", "CRIMINAL_HISTORY", "EVICTION_HISTORY",
  "EMPLOYMENT_VERIFICATION", "RENTAL_HISTORY", "IDENTITY_VERIFICATION",
  "INCOME_VERIFICATION", "BACKGROUND_CHECK",
]);

export const NormalizedRecordSchema = z.object({
  vendorName: z.string().min(1),
  recordType: RecordTypeEnum,
  sourceTimestamp: z.string().optional(),
  summary: z.string().optional(),
  disposition: z.string().optional(),
  amount: z.number().optional(),
  dateOccurred: z.string().optional(),
  dateResolved: z.string().optional(),
  rawData: z.record(z.string(), z.unknown()),
  normalizedData: z.record(z.string(), z.unknown()),
});

export const VendorUploadSchema = z.object({
  applicationId: z.string().min(1),
  vendorName: z.string().min(1),
  vendorType: z.enum(["transunion", "experian", "corelogic", "manual", "demo"]),
  records: z.array(NormalizedRecordSchema),
});

export type NormalizedRecordInput = z.infer<typeof NormalizedRecordSchema>;
export type VendorUploadInput = z.infer<typeof VendorUploadSchema>;
