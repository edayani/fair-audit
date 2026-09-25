import { Activity, AlertTriangle, BellRing, CheckCircle2 } from "lucide-react";
import { getDriftAlerts } from "@/actions/monitoring";
import { PageHeader } from "@/components/shared/page-header";
import { AlertActions, RunDriftButton } from "@/components/monitoring/run-drift-button";
import { PreviewGate } from "@/components/shared/preview-gate";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { Card } from "@/components/ui/card";
import { Badge, SeverityBadge, StatusBadge } from "@/components/ui/badge";
import { cn, formatDate, humanize } from "@/lib/utils";

export const metadata = { title: "Monitoring" };

const DRIFT_COPY: Record<string, string> = {
  POLICY_DRIFT: "Practice diverging from the written policy",
  DATA_DRIFT: "Change in the quality or mix of incoming data",
  DISPARITY_DRIFT: "Change in outcome gaps between protected groups",
};

export default async function MonitoringPage() {
  const alerts = await getDriftAlerts();
  const open = alerts.filter((a) => a.status !== "RESOLVED");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Civil rights analytics"
        authority="Continuous monitoring"
        title="Monitoring"
        description="Screening systems drift. FairAudit watches for policy, data, and disparity drift daily and turns every signal into an alert that must be acknowledged and resolved on the record."
      >
        <PreviewGate label="Full access required">
          <RunDriftButton />
        </PreviewGate>
      </PageHeader>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="New" value={alerts.filter((a) => a.status === "NEW").length} icon={BellRing} tone={alerts.some((a) => a.status === "NEW") ? "danger" : "default"} />
        <StatCard label="Open" value={open.length} icon={AlertTriangle} tone={open.length ? "warning" : "default"} />
        <StatCard label="Resolved" value={alerts.filter((a) => a.status === "RESOLVED").length} icon={CheckCircle2} tone="success" />
      </div>

      {alerts.length === 0 ? (
        <EmptyState icon={Activity} title="No alerts" description="Drift detection runs daily. You can also run it on demand." />
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card key={alert.id} className={cn("p-5", alert.status === "NEW" && "border-l-4 border-l-rose-500")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{alert.title}</h3>
                    <SeverityBadge severity={alert.severity} />
                    <StatusBadge status={alert.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {humanize(alert.driftType)} — {DRIFT_COPY[alert.driftType] ?? ""} · detected {formatDate(alert.detectedAt)}
                  </p>
                </div>
                {alert.status !== "RESOLVED" && (
                  <PreviewGate label="Full access required">
                    <AlertActions alertId={alert.id} status={alert.status} />
                  </PreviewGate>
                )}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{alert.description}</p>
              {alert.baselineValue != null && alert.currentValue != null && (
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Badge>Baseline {alert.baselineValue.toFixed(3)}</Badge>
                  <Badge tone="warning">Current {alert.currentValue.toFixed(3)}</Badge>
                  {alert.deviationPct != null && <Badge tone="danger">{alert.deviationPct.toFixed(1)}% deviation</Badge>}
                  {alert.threshold != null && <Badge>Threshold {alert.threshold}%</Badge>}
                </div>
              )}
              {alert.resolution && (
                <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                  <span className="font-medium">Resolution: </span>
                  {alert.resolution}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
