import { getDisparateImpactSummary, getDisparityReports } from "@/actions/fairness";
import { PageHeader } from "@/components/shared/page-header";
import { FairnessChart } from "@/components/fairness/fairness-chart";
import { BurdenShiftingPanel } from "@/components/fairness/burden-shifting-panel";
import { RunFairnessButton } from "@/components/fairness/run-fairness-button";
import { formatDate, formatPercent, humanize } from "@/lib/utils";
import Link from "next/link";
import { AlertTriangle, CheckCircle } from "lucide-react";

export default async function FairnessPage() {
  const [disparateImpact, reports] = await Promise.all([getDisparateImpactSummary(), getDisparityReports()]);

  return (
    <div>
      <PageHeader title="Fairness Testing" description="Civil rights monitoring & disparate impact analysis (Spec §4.F)">
        <RunFairnessButton />
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {disparateImpact.map((di) => (
          <div key={di.protectedClass} className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{humanize(di.protectedClass)}</h3>
              {di.hasPotentialDisparateImpact ? (
                <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full dark:bg-red-900/30 dark:text-red-400">
                  <AlertTriangle className="h-3 w-3" /> Potential Disparate Impact
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-400">
                  <CheckCircle className="h-3 w-3" /> Within Threshold
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3">Impact Ratio: <span className="font-semibold">{di.impactRatio.toFixed(3)}</span> (threshold: 0.800)</p>
            <FairnessChart groups={di.groups} />
            {di.hasPotentialDisparateImpact && (() => {
              const matchingReport = reports.find((r) => {
                const findings = r.findings as { disparateImpactResults?: Array<{ protectedClass: string }> } | null;
                return findings?.disparateImpactResults?.some((f) => f.protectedClass === di.protectedClass);
              });
              if (matchingReport) {
                return <BurdenShiftingPanel disparityReportId={matchingReport.id} protectedClass={di.protectedClass} impactRatio={di.impactRatio} />;
              }
              return (
                <p className="text-xs text-muted-foreground mt-4 italic">
                  Run fairness analysis to generate a disparity report, then complete the burden-shifting analysis.
                </p>
              );
            })()}
          </div>
        ))}
        {disparateImpact.length === 0 && <p className="text-muted-foreground col-span-2">No fairness data available. Run analysis or seed demo data.</p>}
      </div>

      {reports.length > 0 && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Disparity Reports</h3>
          <div className="space-y-2">
            {reports.map((report) => (
              <Link key={report.id} href={`/dashboard/fairness/reports/${report.id}`} className="flex items-center justify-between p-3 rounded-md hover:bg-muted border">
                <div>
                  <p className="text-sm font-medium">{report.summary?.slice(0, 80) ?? "Report"}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(report.periodStart)} - {formatDate(report.periodEnd)}</p>
                </div>
                <span className="text-xs text-muted-foreground">{humanize(report.status)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
