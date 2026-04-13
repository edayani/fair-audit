import { getDriftAlerts } from "@/actions/monitoring";
import { PageHeader } from "@/components/shared/page-header";
import { RunDriftButton } from "@/components/monitoring/run-drift-button";
import { formatDate, humanize, getSeverityColor } from "@/lib/utils";
import { AlertTriangle, CheckCircle } from "lucide-react";

export default async function MonitoringPage() {
  const alerts = await getDriftAlerts();
  const newAlerts = alerts.filter((a) => a.status === "NEW");

  return (
    <div>
      <PageHeader title="Continuous Monitoring" description="Policy, data, and disparity drift detection (Spec §4.L)">
        <RunDriftButton />
      </PageHeader>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">New Alerts</p><p className="text-2xl font-bold">{newAlerts.length}</p></div>
        <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">Total Alerts</p><p className="text-2xl font-bold">{alerts.length}</p></div>
        <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">Resolved</p><p className="text-2xl font-bold">{alerts.filter((a) => a.status === "RESOLVED").length}</p></div>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
          <p className="text-muted-foreground">No drift alerts. Run detection to check for drift.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className={`rounded-lg border p-4 ${alert.status === "NEW" ? "border-l-4 border-l-orange-400" : ""}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${alert.severity === "CRITICAL" ? "text-red-500" : "text-orange-500"}`} />
                  <span className="font-medium">{alert.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getSeverityColor(alert.severity)}`}>{alert.severity}</span>
                  <span className="text-xs text-muted-foreground">{humanize(alert.driftType)}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{alert.description}</p>
              {alert.baselineValue != null && alert.currentValue != null && (
                <p className="text-xs text-muted-foreground mt-1">Baseline: {alert.baselineValue.toFixed(3)} → Current: {alert.currentValue.toFixed(3)} (deviation: {alert.deviationPct?.toFixed(1)}%)</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{formatDate(alert.detectedAt)} | Status: {humanize(alert.status)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
