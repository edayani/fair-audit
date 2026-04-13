"use server";

// Spec §4.I — Applicant Challenge, Mitigation & Accommodation Server Actions
import { prisma } from "@/lib/prisma";
import { getAuthContext, requireFullAccess } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { CreateChallengeInput, CreateAccommodationInput } from "@/lib/validators/challenge";
import type { ActionResult } from "@/types";

export async function submitChallenge(input: CreateChallengeInput): Promise<ActionResult<{ id: string }>> {
  const { orgId } = await getAuthContext();
  const denied = await requireFullAccess();
  if (denied) return denied;

  await prisma.application.findFirstOrThrow({
    where: { id: input.applicationId, organizationId: orgId },
  });

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

  revalidatePath(`/dashboard/applications/${input.applicationId}/challenge`);
  return { success: true, data: { id: challenge.id } };
}

export async function resolveChallenge(
  challengeId: string,
  status: "RESOLVED_ACCEPTED" | "RESOLVED_REJECTED",
  resolution: string
): Promise<ActionResult> {
  const { orgId, userId } = await getAuthContext();
  const denied = await requireFullAccess();
  if (denied) return denied;

  const challenge = await prisma.challenge.findFirstOrThrow({
    where: { id: challengeId },
    include: { application: true },
  });

  if (challenge.application.organizationId !== orgId) {
    return { success: false, error: "Unauthorized" };
  }

  await prisma.challenge.update({
    where: { id: challengeId },
    data: { status, resolution, resolvedBy: userId, resolvedAt: new Date() },
  });

  revalidatePath(`/dashboard/applications/${challenge.applicationId}/challenge`);
  return { success: true };
}

export async function submitAccommodation(input: CreateAccommodationInput): Promise<ActionResult<{ id: string }>> {
  const { orgId } = await getAuthContext();
  const denied = await requireFullAccess();
  if (denied) return denied;

  await prisma.application.findFirstOrThrow({
    where: { id: input.applicationId, organizationId: orgId },
  });

  const accommodation = await prisma.accommodation.create({
    data: input,
  });

  revalidatePath(`/dashboard/applications/${input.applicationId}`);
  return { success: true, data: { id: accommodation.id } };
}

export async function resolveAccommodation(
  accommodationId: string,
  status: "GRANTED" | "DENIED",
  deniedReason?: string
): Promise<ActionResult> {
  const { orgId } = await getAuthContext();
  const denied = await requireFullAccess();
  if (denied) return denied;
  // Verify accommodation belongs to org
  const accommodation = await prisma.accommodation.findFirstOrThrow({
    where: { id: accommodationId, application: { organizationId: orgId } },
  });

  await prisma.accommodation.update({
    where: { id: accommodationId },
    data: {
      status,
      ...(status === "GRANTED" ? { grantedAt: new Date() } : {}),
      ...(status === "DENIED" ? { deniedReason: deniedReason ?? "No reason provided" } : {}),
    },
  });

  revalidatePath(`/dashboard/applications/${accommodation.applicationId}/accommodation`);
  return { success: true };
}

export async function getChallenges(applicationId: string) {
  const { orgId } = await getAuthContext();
  await prisma.application.findFirstOrThrow({
    where: { id: applicationId, organizationId: orgId },
  });

  return prisma.challenge.findMany({
    where: { applicationId },
    include: { documents: true },
    orderBy: { createdAt: "desc" },
  });
}
