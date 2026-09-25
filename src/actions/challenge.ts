"use server";

// Spec §4.I — Applicant Challenge, Mitigation & Accommodation Server Actions
import { prisma } from "@/lib/prisma";
import { getAuthContext, requireFullAccess } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { preserveEvidence, recordAudit } from "@/lib/audit";
import { CreateAccommodationSchema, CreateChallengeSchema } from "@/lib/validators/challenge";
import type { CreateChallengeInput, CreateAccommodationInput } from "@/lib/validators/challenge";
import type { ActionResult } from "@/types";

export async function submitChallenge(raw: CreateChallengeInput): Promise<ActionResult<{ id: string }>> {
  const denied = await requireFullAccess();
  if (denied) return denied;
  const { orgId } = await getAuthContext();
  const parsed = CreateChallengeSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid challenge" };
  const input = parsed.data;

  const application = await prisma.application.findFirst({
    where: { id: input.applicationId, organizationId: orgId },
    select: { id: true },
  });
  if (!application) return { success: false, error: "Application not found" };

  const challenge = await prisma.challenge.create({
    data: {
      applicationId: input.applicationId,
      type: input.type,
      description: input.description,
      recordIds: input.recordIds,
      circumstanceType: input.circumstanceType,
      mitigatingEvidence: input.mitigatingEvidence,
    },
  });

  await recordAudit({
    tableName: "Challenge",
    recordId: challenge.id,
    action: "CHALLENGE_SUBMITTED",
    after: { type: challenge.type, status: challenge.status },
    metadata: { applicationId: input.applicationId },
  });
  await preserveEvidence({
    entityType: "challenge",
    entityId: challenge.id,
    documentType: "applicant_statement",
    content: { type: input.type, description: input.description, mitigatingEvidence: input.mitigatingEvidence ?? null },
    description: `${input.type.toLowerCase()} challenge statement`,
  });

  revalidatePath(`/dashboard/applications/${input.applicationId}`, "layout");
  return { success: true, data: { id: challenge.id } };
}

export async function resolveChallenge(
  challengeId: string,
  status: "RESOLVED_ACCEPTED" | "RESOLVED_REJECTED",
  resolution: string
): Promise<ActionResult> {
  const denied = await requireFullAccess();
  if (denied) return denied;
  const { orgId, userId, userEmail } = await getAuthContext();
  if (!resolution.trim()) return { success: false, error: "A written resolution is required." };

  const challenge = await prisma.challenge.findFirst({
    where: { id: challengeId, application: { organizationId: orgId } },
  });
  if (!challenge) return { success: false, error: "Challenge not found" };

  await prisma.challenge.update({
    where: { id: challengeId },
    data: { status, resolution, resolvedBy: userEmail ?? userId, resolvedAt: new Date() },
  });

  await recordAudit({
    tableName: "Challenge",
    recordId: challengeId,
    action: status === "RESOLVED_ACCEPTED" ? "CHALLENGE_SUSTAINED" : "CHALLENGE_DENIED",
    before: { status: challenge.status },
    after: { status, resolution },
    metadata: { applicationId: challenge.applicationId },
  });
  await preserveEvidence({
    entityType: "challenge",
    entityId: challengeId,
    documentType: "challenge_resolution",
    content: { status, resolution },
    description: "Written resolution of applicant challenge",
  });

  revalidatePath(`/dashboard/applications/${challenge.applicationId}`, "layout");
  return { success: true };
}

export async function submitAccommodation(raw: CreateAccommodationInput): Promise<ActionResult<{ id: string }>> {
  const denied = await requireFullAccess();
  if (denied) return denied;
  const { orgId } = await getAuthContext();
  const parsed = CreateAccommodationSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request" };
  const input = parsed.data;

  const application = await prisma.application.findFirst({
    where: { id: input.applicationId, organizationId: orgId },
    select: { id: true },
  });
  if (!application) return { success: false, error: "Application not found" };

  const accommodation = await prisma.accommodation.create({
    data: input,
  });

  await recordAudit({
    tableName: "Accommodation",
    recordId: accommodation.id,
    action: "ACCOMMODATION_REQUESTED",
    after: { accommodationType: accommodation.accommodationType, isDisabilityRelated: accommodation.isDisabilityRelated },
    metadata: { applicationId: input.applicationId },
  });

  revalidatePath(`/dashboard/applications/${input.applicationId}`, "layout");
  return { success: true, data: { id: accommodation.id } };
}

export async function resolveAccommodation(
  accommodationId: string,
  status: "GRANTED" | "DENIED",
  deniedReason?: string
): Promise<ActionResult> {
  const denied = await requireFullAccess();
  if (denied) return denied;
  const { orgId } = await getAuthContext();
  // Verify accommodation belongs to org
  const accommodation = await prisma.accommodation.findFirst({
    where: { id: accommodationId, application: { organizationId: orgId } },
  });
  if (!accommodation) return { success: false, error: "Request not found" };
  if (status === "DENIED" && !deniedReason?.trim()) {
    return { success: false, error: "Denials require a stated reason (and should follow the interactive process)." };
  }

  await prisma.accommodation.update({
    where: { id: accommodationId },
    data: {
      status,
      ...(status === "GRANTED" ? { grantedAt: new Date() } : {}),
      ...(status === "DENIED" ? { deniedReason: deniedReason ?? "No reason provided" } : {}),
    },
  });

  await recordAudit({
    tableName: "Accommodation",
    recordId: accommodationId,
    action: status === "GRANTED" ? "ACCOMMODATION_GRANTED" : "ACCOMMODATION_DENIED",
    before: { status: accommodation.status },
    after: { status, deniedReason: deniedReason ?? null },
    metadata: { applicationId: accommodation.applicationId },
  });

  revalidatePath(`/dashboard/applications/${accommodation.applicationId}`, "layout");
  return { success: true };
}

export async function getChallenges(applicationId: string) {
  const { orgId } = await getAuthContext();
  return prisma.challenge.findMany({
    where: { applicationId, application: { organizationId: orgId } },
    include: { documents: true },
    orderBy: { createdAt: "desc" },
  });
}
