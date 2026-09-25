"use server";

// Spec §4.L — Continuous Monitoring & Drift Detection Server Actions
import { prisma } from "@/lib/prisma";
import { getAuthContext, requireFullAccess } from "@/lib/auth";
import { checkPolicyDrift, checkDataDrift } from "@/lib/engines/drift";
import { revalidatePath } from "next/cache";
import { recordAudit } from "@/lib/audit";
import type { ActionResult } from "@/types";

export async function runDriftDetection(): Promise<ActionResult<{ alertsCreated: number }>> {
  const denied = await requireFullAccess();
  if (denied) return denied;
  const { orgId } = await getAuthContext();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Current period stats
  const currentDecisions = await prisma.decision.count({
    where: { application: { organizationId: orgId }, createdAt: { gte: thirtyDaysAgo } },
  });
  const currentOverrides = await prisma.override.count({
    where: { decision: { application: { organizationId: orgId } }, overriddenAt: { gte: thirtyDaysAgo } },
  });

  // Baseline period stats
  const baselineDecisions = await prisma.decision.count({
    where: { application: { organizationId: orgId }, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
  });
  const baselineOverrides = await prisma.override.count({
    where: { decision: { application: { organizationId: orgId } }, overriddenAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
  });

  const driftResults = [];

  // Policy drift
  const policyDrift = checkPolicyDrift(
    currentDecisions,
    currentOverrides,
    baselineDecisions > 0 ? baselineOverrides / baselineDecisions : 0.1
  );
  driftResults.push(policyDrift);

  // Data drift
  const currentRecords = await prisma.screeningRecord.aggregate({
    where: { application: { organizationId: orgId }, createdAt: { gte: thirtyDaysAgo } },
    _count: true,
  });
  const currentMissingDisp = await prisma.screeningRecord.count({
    where: { application: { organizationId: orgId }, createdAt: { gte: thirtyDaysAgo }, hasDisposition: false },
  });
  const currentLowConf = await prisma.screeningRecord.count({
    where: { application: { organizationId: orgId }, createdAt: { gte: thirtyDaysAgo }, identityConfidence: { lt: 60 } },
  });

  const baselineRecords = await prisma.screeningRecord.aggregate({
    where: { application: { organizationId: orgId }, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    _count: true,
  });
  const baselineMissingDisp = await prisma.screeningRecord.count({
    where: { application: { organizationId: orgId }, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }, hasDisposition: false },
  });
  const baselineLowConf = await prisma.screeningRecord.count({
    where: { application: { organizationId: orgId }, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }, identityConfidence: { lt: 60 } },
  });

  const dataDrifts = checkDataDrift(
    { totalRecords: currentRecords._count, missingDisposition: currentMissingDisp, lowConfidence: currentLowConf, staleRecords: 0 },
    { totalRecords: baselineRecords._count, missingDisposition: baselineMissingDisp, lowConfidence: baselineLowConf, staleRecords: 0 }
  );
  driftResults.push(...dataDrifts);

  // Create alerts for detected drifts
  let alertsCreated = 0;
  for (const result of driftResults) {
    if (result.detected) {
      await prisma.driftAlert.create({
        data: {
          organizationId: orgId,
          driftType: result.type,
          severity: result.severity,
          title: result.title,
          description: result.description,
          metricName: result.metricName,
          baselineValue: result.baselineValue,
          currentValue: result.currentValue,
          deviationPct: result.deviationPct,
          threshold: result.threshold,
        },
      });
      alertsCreated++;
    }
  }

  await recordAudit({ tableName: "DriftAlert", recordId: orgId, action: "DRIFT_DETECTION", after: { alertsCreated } });
  revalidatePath("/dashboard", "layout");
  return { success: true, data: { alertsCreated } };
}

export async function getDriftAlerts(status?: string) {
  const { orgId } = await getAuthContext();
  return prisma.driftAlert.findMany({
    where: {
      organizationId: orgId,
      ...(status && { status }),
    },
    orderBy: { detectedAt: "desc" },
  });
}

export async function acknowledgeDriftAlert(alertId: string): Promise<ActionResult> {
  const denied = await requireFullAccess();
  if (denied) return denied;
  const { orgId, userId, userEmail } = await getAuthContext();

  const alert = await prisma.driftAlert.findFirst({
    where: { id: alertId, organizationId: orgId },
  });
  if (!alert) return { success: false, error: "Alert not found" };

  await prisma.driftAlert.update({
    where: { id: alertId },
    data: { status: "ACKNOWLEDGED", acknowledgedAt: new Date(), acknowledgedBy: userEmail ?? userId },
  });

  await recordAudit({ tableName: "DriftAlert", recordId: alertId, action: "ALERT_ACKNOWLEDGED", before: { status: alert.status }, after: { status: "ACKNOWLEDGED" } });
  revalidatePath("/dashboard", "layout");
  return { success: true };
}

export async function resolveDriftAlert(alertId: string, resolution: string): Promise<ActionResult> {
  const denied = await requireFullAccess();
  if (denied) return denied;
  const { orgId } = await getAuthContext();
  if (!resolution.trim()) return { success: false, error: "Describe how the alert was resolved." };

  const alert = await prisma.driftAlert.findFirst({
    where: { id: alertId, organizationId: orgId },
  });
  if (!alert) return { success: false, error: "Alert not found" };

  await prisma.driftAlert.update({
    where: { id: alertId },
    data: { status: "RESOLVED", resolvedAt: new Date(), resolution },
  });

  await recordAudit({ tableName: "DriftAlert", recordId: alertId, action: "ALERT_RESOLVED", before: { status: alert.status }, after: { status: "RESOLVED", resolution } });
  revalidatePath("/dashboard", "layout");
  return { success: true };
}
