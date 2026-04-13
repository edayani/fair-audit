"use server";

// Spec §4.C — Identity Resolution Server Actions
import { prisma } from "@/lib/prisma";
import { getAuthContext, requireFullAccess } from "@/lib/auth";
import { computeIdentityConfidence, assessRecordQuality } from "@/lib/engines/identity";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

export async function resolveIdentity(applicationId: string): Promise<ActionResult<{ processed: number; quarantined: number }>> {
  const denied = await requireFullAccess();
  if (denied) return denied;
  const { orgId } = await getAuthContext();

  const application = await prisma.application.findFirstOrThrow({
    where: { id: applicationId, organizationId: orgId },
    include: { applicant: true, screeningRecords: true },
  });

  let quarantined = 0;

  for (const record of application.screeningRecords) {
    // Compute identity confidence
    const matchResult = computeIdentityConfidence(application.applicant, record);

    // Assess record quality
    const qualityResult = assessRecordQuality(record);

    const shouldQuarantine = matchResult.shouldQuarantine || qualityResult.shouldSuppress;
    const reason = [matchResult.quarantineReason, ...qualityResult.flags].filter(Boolean).join("; ");

    await prisma.screeningRecord.update({
      where: { id: record.id },
      data: {
        identityConfidence: matchResult.confidence,
        matchMethod: matchResult.matchedFields.join(","),
        isQuarantined: shouldQuarantine,
        quarantineReason: shouldQuarantine ? reason : null,
      },
    });

    if (shouldQuarantine) quarantined++;
  }

  revalidatePath(`/dashboard/applications/${applicationId}/records`);
  return { success: true, data: { processed: application.screeningRecords.length, quarantined } };
}
