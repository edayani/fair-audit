"use server";

// Spec §4.B — Data Ingestion & Normalization Server Actions
import { prisma } from "@/lib/prisma";
import { getAuthContext, requireFullAccess } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { recordAudit } from "@/lib/audit";
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
  const application = await prisma.application.findFirst({
    where: { id: applicationId, organizationId: orgId },
    select: { id: true },
  });
  if (!application) return { success: false, error: "Application not found" };
  if (records.length === 0) return { success: false, error: "No records to ingest" };
  if (records.length > 500) return { success: false, error: "Upload at most 500 records at a time" };
  const allowedTypes = ["CREDIT_REPORT", "CRIMINAL_HISTORY", "EVICTION_HISTORY", "EMPLOYMENT_VERIFICATION", "RENTAL_HISTORY", "IDENTITY_VERIFICATION", "INCOME_VERIFICATION", "BACKGROUND_CHECK"];
  if (records.some((r) => !allowedTypes.includes(r.recordType) || !r.vendorName?.trim())) {
    return { success: false, error: "Each record needs a vendor and a supported record type" };
  }

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

  await recordAudit({
    tableName: "ScreeningRecord",
    recordId: applicationId,
    action: "INGEST",
    after: { count: created.count, vendors: [...new Set(records.map((r) => r.vendorName))] },
    metadata: { applicationId },
  });

  revalidatePath("/dashboard/ingestion");
  revalidatePath(`/dashboard/applications/${applicationId}`, "layout");
  return { success: true, data: { count: created.count } };
}

export async function getScreeningRecords(applicationId: string) {
  const { orgId } = await getAuthContext();
  return prisma.screeningRecord.findMany({
    where: { applicationId, application: { organizationId: orgId } },
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
  const record = await prisma.screeningRecord.findFirst({
    where: { id: recordId, application: { organizationId: orgId } },
  });
  if (!record) return { success: false, error: "Record not found" };

  await prisma.screeningRecord.update({
    where: { id: recordId },
    data: { isQuarantined: true, quarantineReason: reason },
  });

  await recordAudit({ tableName: "ScreeningRecord", recordId, action: "QUARANTINE", after: { reason }, metadata: { applicationId: record.applicationId } });
  revalidatePath(`/dashboard/applications/${record.applicationId}`, "layout");
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
