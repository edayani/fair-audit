"use server";

// Spec §4.D — Relevance-to-Tenancy Server Actions
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { labelRecordRelevance, applyCaliforniaRelevanceRules } from "@/lib/engines/relevance";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

export async function labelApplicationRelevance(applicationId: string): Promise<ActionResult<{ labeled: number }>> {
  const { orgId } = await getAuthContext();

  const application = await prisma.application.findFirstOrThrow({
    where: { id: applicationId, organizationId: orgId },
    include: {
      screeningRecords: true,
      property: {
        include: { screeningPolicies: { where: { isActive: true }, include: { rules: true }, take: 1 } },
      },
    },
  });

  const org = await prisma.organization.findFirstOrThrow({ where: { id: orgId } });
  const activePolicy = application.property.screeningPolicies[0];
  if (!activePolicy) return { success: false, error: "No active screening policy for this property" };

  let labeled = 0;
  for (const record of application.screeningRecords) {
    if (record.isQuarantined) continue; // Skip quarantined records

    let result = labelRecordRelevance(record, activePolicy.rules);

    // Apply California-specific rules if applicable
    if (org.complianceMode === "FEDERAL_CA") {
      result = applyCaliforniaRelevanceRules(result, record, application.hasVoucher);
    }

    await prisma.screeningRecord.update({
      where: { id: record.id },
      data: {
        relevance: result.label,
        relevanceReason: result.reason,
      },
    });
    labeled++;
  }

  revalidatePath(`/dashboard/applications/${applicationId}/records`);
  return { success: true, data: { labeled } };
}

export async function overrideRelevance(
  recordId: string,
  newLabel: "RELEVANT" | "IRRELEVANT" | "CONDITIONAL" | "PROHIBITED",
  reason: string
): Promise<ActionResult> {
  const { orgId } = await getAuthContext();

  const record = await prisma.screeningRecord.findFirstOrThrow({
    where: { id: recordId },
    include: { application: true },
  });

  if (record.application.organizationId !== orgId) {
    return { success: false, error: "Unauthorized" };
  }

  await prisma.screeningRecord.update({
    where: { id: recordId },
    data: {
      relevance: newLabel,
      relevanceReason: reason,
      relevanceOverride: true,
    },
  });

  return { success: true };
}
