"use server";

// Spec §4.D — Relevance-to-Tenancy Server Actions
import { prisma } from "@/lib/prisma";
import { getAuthContext, requireFullAccess } from "@/lib/auth";
import { labelRecordRelevance, applyCaliforniaRelevanceRules } from "@/lib/engines/relevance";
import { revalidatePath } from "next/cache";
import { recordAudit } from "@/lib/audit";
import type { ActionResult } from "@/types";

export async function labelApplicationRelevance(applicationId: string): Promise<ActionResult<{ labeled: number }>> {
  const denied = await requireFullAccess();
  if (denied) return denied;
  const { orgId } = await getAuthContext();

  const application = await prisma.application.findFirst({
    where: { id: applicationId, organizationId: orgId },
    include: {
      screeningRecords: true,
      property: {
        include: { screeningPolicies: { where: { isActive: true }, include: { rules: true }, take: 1 } },
      },
    },
  });

  if (!application) return { success: false, error: "Application not found" };

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

  await recordAudit({
    tableName: "ScreeningRecord",
    recordId: applicationId,
    action: "RELEVANCE_LABELING",
    after: { labeled },
    metadata: { applicationId, complianceMode: org.complianceMode },
  });

  revalidatePath(`/dashboard/applications/${applicationId}`, "layout");
  return { success: true, data: { labeled } };
}

export async function overrideRelevance(
  recordId: string,
  newLabel: "RELEVANT" | "IRRELEVANT" | "CONDITIONAL" | "PROHIBITED",
  reason: string
): Promise<ActionResult> {
  const denied = await requireFullAccess();
  if (denied) return denied;
  const { orgId } = await getAuthContext();

  const record = await prisma.screeningRecord.findFirst({
    where: { id: recordId, application: { organizationId: orgId } },
  });
  if (!record) return { success: false, error: "Record not found" };

  await prisma.screeningRecord.update({
    where: { id: recordId },
    data: {
      relevance: newLabel,
      relevanceReason: reason,
      relevanceOverride: true,
    },
  });

  await recordAudit({
    tableName: "ScreeningRecord",
    recordId,
    action: "RELEVANCE_OVERRIDE",
    before: { relevance: record.relevance },
    after: { relevance: newLabel, reason },
    metadata: { applicationId: record.applicationId },
  });
  revalidatePath(`/dashboard/applications/${record.applicationId}`, "layout");
  return { success: true };
}
