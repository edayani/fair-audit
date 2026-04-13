// Spec §4.I — Challenge Validators (3 types)
import { z } from "zod/v4";

export const ChallengeTypeEnum = z.enum(["ACCURACY", "RELEVANCE", "MITIGATION"]);

export const CreateChallengeSchema = z.object({
  applicationId: z.string().min(1),
  type: ChallengeTypeEnum,
  description: z.string().min(10, "Please provide a detailed description"),
  recordIds: z.array(z.string()).min(1, "At least one record must be referenced"),
  // Mitigation-specific
  circumstanceType: z.string().optional(),
  mitigatingEvidence: z.string().optional(),
});

export const ResolveChallengeSchema = z.object({
  challengeId: z.string().min(1),
  status: z.enum(["RESOLVED_ACCEPTED", "RESOLVED_REJECTED"]),
  resolution: z.string().min(1, "Resolution description is required"),
});

export const CreateAccommodationSchema = z.object({
  applicationId: z.string().min(1),
  accommodationType: z.string().min(1, "Accommodation type is required"),
  description: z.string().min(10, "Please describe the accommodation needed"),
  isDisabilityRelated: z.boolean(),
});

export type CreateChallengeInput = z.infer<typeof CreateChallengeSchema>;
export type ResolveChallengeInput = z.infer<typeof ResolveChallengeSchema>;
export type CreateAccommodationInput = z.infer<typeof CreateAccommodationSchema>;
