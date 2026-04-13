"use server";

// Spec §4.B — Data Ingestion & Normalization Server Actions
import { prisma } from "@/lib/prisma";
import { getAuthContext, requireFullAccess } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

export async function ingestScreeningRecords(
  applicationId: string,
  records: Array<{
    vendorName: string;
    recordType: string;
    rawData: Record<string, unknown>;
    normalizedData: Record<string, unknown>;
    summary?: string;
    disposition?: string;
    amount?: number;
    dateOccurred?: string;
    dateResolved?: string;
  }>
): Promise<ActionResult<{ count: number }>> {
  const denied = await requireFullAccess();
  if (denied) return denied;
  const { orgId } = await getAuthContext();

  // Verify the application belongs to this org
  await prisma.application.findFirstOrThrow({
    where: { id: applicationId, organizationId: orgId },
  });

  const created = await prisma.screeningRecord.createMany({
    data: records.map((record) => ({
      applicationId,
      vendorName: record.vendorName,
      recordType: record.recordType as "CREDIT_REPORT" | "CRIMINAL_HISTORY" | "EVICTION_HISTORY" | "EMPLOYMENT_VERIFICATION" | "RENTAL_HISTORY" | "IDENTITY_VERIFICATION" | "INCOME_VERIFICATION" | "BACKGROUND_CHECK",
      rawData: JSON.parse(JSON.stringify(record.rawData)),
      normalizedData: JSON.parse(JSON.stringify(record.normalizedData)),
      summary: record.summary,
      disposition: record.disposition,
      amount: record.amount,
      dateOccurred: record.dateOccurred ? new Date(record.dateOccurred) : null,
      dateResolved: record.dateResolved ? new Date(record.dateResolved) : null,
      hasDisposition: !!record.disposition,
    })),
  });

  revalidatePath(`/dashboard/applications/${applicationId}/records`);
  return { success: true, data: { count: created.count } };
}

export async function getScreeningRecords(applicationId: string) {
  const { orgId } = await getAuthContext();
  await prisma.application.findFirstOrThrow({
    where: { id: applicationId, organizationId: orgId },
  });

  return prisma.screeningRecord.findMany({
    where: { applicationId },
    orderBy: { createdAt: "desc" },
  });
}

export async function quarantineRecord(
  recordId: string,
  reason: string
): Promise<ActionResult> {
  const denied = await requireFullAccess();
  if (denied) return denied;
  const { orgId } = await getAuthContext();

  // Verify the record's application belongs to this org
  const record = await prisma.screeningRecord.findFirstOrThrow({
    where: { id: recordId },
    include: { application: true },
  });

  if (record.application.organizationId !== orgId) {
    return { success: false, error: "Unauthorized" };
  }

  await prisma.screeningRecord.update({
    where: { id: recordId },
    data: { isQuarantined: true, quarantineReason: reason },
  });

  return { success: true };
}

export async function getIngestionStats() {
  const { orgId } = await getAuthContext();

  const records = await prisma.screeningRecord.findMany({
    where: { application: { organizationId: orgId } },
    select: {
      recordType: true,
      vendorName: true,
      isQuarantined: true,
      hasDisposition: true,
      createdAt: true,
    },
  });

  const byVendor = new Map<string, number>();
  const byType = new Map<string, number>();
  let quarantined = 0;
  let missingDisposition = 0;

  for (const r of records) {
    byVendor.set(r.vendorName, (byVendor.get(r.vendorName) ?? 0) + 1);
    byType.set(r.recordType, (byType.get(r.recordType) ?? 0) + 1);
    if (r.isQuarantined) quarantined++;
    if (!r.hasDisposition) missingDisposition++;
  }

  return {
    total: records.length,
    byVendor: Object.fromEntries(byVendor),
    byType: Object.fromEntries(byType),
    quarantined,
    missingDisposition,
  };
}
