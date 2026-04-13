import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPolicyDrift, checkDataDrift } from "@/lib/engines/drift";

// Spec §4.L — Drift detection cron endpoint
// Can be called by Vercel Cron or external scheduler
export async function GET() {
  try {
    const orgs = await prisma.organization.findMany({ select: { id: true } });
    let totalAlerts = 0;

    for (const org of orgs) {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const currentDecisions = await prisma.decision.count({
        where: { application: { organizationId: org.id }, createdAt: { gte: thirtyDaysAgo } },
      });
      const currentOverrides = await prisma.override.count({
        where: { decision: { application: { organizationId: org.id } }, overriddenAt: { gte: thirtyDaysAgo } },
      });
      const baselineDecisions = await prisma.decision.count({
        where: { application: { organizationId: org.id }, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      });
      const baselineOverrides = await prisma.override.count({
        where: { decision: { application: { organizationId: org.id } }, overriddenAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      });

      const policyDrift = checkPolicyDrift(currentDecisions, currentOverrides, baselineDecisions > 0 ? baselineOverrides / baselineDecisions : 0.1);

      if (policyDrift.detected) {
        await prisma.driftAlert.create({
          data: {
            organizationId: org.id,
            driftType: policyDrift.type,
            severity: policyDrift.severity,
            title: policyDrift.title,
            description: policyDrift.description,
            metricName: policyDrift.metricName,
            baselineValue: policyDrift.baselineValue,
            currentValue: policyDrift.currentValue,
            deviationPct: policyDrift.deviationPct,
            threshold: policyDrift.threshold,
          },
        });
        totalAlerts++;
      }

      // Data drift check
      const currentRecords = await prisma.screeningRecord.count({ where: { application: { organizationId: org.id }, createdAt: { gte: thirtyDaysAgo } } });
      const currentMissing = await prisma.screeningRecord.count({ where: { application: { organizationId: org.id }, createdAt: { gte: thirtyDaysAgo }, hasDisposition: false } });
      const baselineRecords = await prisma.screeningRecord.count({ where: { application: { organizationId: org.id }, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } });
      const baselineMissing = await prisma.screeningRecord.count({ where: { application: { organizationId: org.id }, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }, hasDisposition: false } });

      const dataDrifts = checkDataDrift(
        { totalRecords: currentRecords, missingDisposition: currentMissing, lowConfidence: 0, staleRecords: 0 },
        { totalRecords: baselineRecords, missingDisposition: baselineMissing, lowConfidence: 0, staleRecords: 0 }
      );

      for (const d of dataDrifts) {
        if (d.detected) {
          await prisma.driftAlert.create({
            data: {
              organizationId: org.id,
              driftType: d.type,
              severity: d.severity,
              title: d.title,
              description: d.description,
              metricName: d.metricName,
              baselineValue: d.baselineValue,
              currentValue: d.currentValue,
              deviationPct: d.deviationPct,
              threshold: d.threshold,
            },
          });
          totalAlerts++;
        }
      }
    }

    return NextResponse.json({ success: true, alertsCreated: totalAlerts });
  } catch (error) {
    console.error("Drift cron error:", error);
    return NextResponse.json({ error: "Drift detection failed" }, { status: 500 });
  }
}
