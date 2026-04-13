// Application & Applicant Validators
import { z } from "zod/v4";

export const CreateApplicantSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  ssnLast4: z.string().length(4, "Must be exactly 4 digits").regex(/^\d{4}$/).optional(),
  // Demographic data — optional, for fairness auditing only
  race: z.string().optional(),
  ethnicity: z.string().optional(),
  sex: z.string().optional(),
  familialStatus: z.string().optional(),
  disability: z.boolean().optional(),
  nationalOrigin: z.string().optional(),
  sourceOfIncome: z.string().optional(),
});

export const CreateApplicationSchema = z.object({
  applicantId: z.string().min(1),
  propertyId: z.string().min(1),
  unitAppliedFor: z.string().optional(),
  monthlyIncome: z.number().positive().optional(),
  hasVoucher: z.boolean().default(false),
  voucherType: z.string().optional(),
  voucherAmount: z.number().positive().optional(),
});

export type CreateApplicantInput = z.infer<typeof CreateApplicantSchema>;
export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;
