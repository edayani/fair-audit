import Link from "next/link";
import { AlertTriangle, ArrowRight, BarChart3, CheckCircle2, FileBarChart } from "lucide-react";
import { getBurdenShiftingAnalyses, getDisparateImpactSummary, getDisparityReports } from "@/actions/fairness";
import { getAuthContext } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { FairnessChart } from "@/components/fairness/fairness-chart";
import { BurdenShiftingPanel } from "@/components/fairness/burden-shifting-panel";
import { RunFairnessButton } from "@/components/fairness/run-fairness-button";
import { PreviewGate } from "@/components/shared/preview-gate";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeaderRow } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { cn, formatDate, humanize } from "@/lib/utils";

export const metadata = { title: "Disparate impact" };

const CLASS_LABELS: Record<string, string> = {
  race: "Race & ethnicity",
  sex: "Sex",
  familialStatus: "Familial status",
  sourceOfIncome: "Source of income",
};

export default async function FairnessPage() {
  const [disparateImpact, reports, ctx] = await Promise.all([getDisparateImpactSummary(), getDisparityReports(), getAuthContext()]);
  const latestReport = reports[0];
  const analyses = latestReport ? await getBurdenShiftingAnalyses(latestReport.id) : [];
  const withData = disparateImpact.filter((d) => d.groups.length >= 2);
  const flagged = withData.filter((d) => d.hasPotentialDisparateImpact);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Civil rights analytics"
        authority="Fair Housing Act · discriminatory effects"
        title="Disparate impact"
        description="Outcome parity across protected classes, measured with the four-fifths rule as a screening heuristic. Any flagged disparity triggers a documented three-step burden-shifting analysis."
      >
        <PreviewGate label="Full access required">
          <RunFairnessButton />
        </PreviewGate>
      </PageHeader>

      <div
        className={cn(
          "flex items-start gap-3 rounded-xl border px-5 py-4",
          flagged.length > 0
            ? "border-rose-200 bg-rose-50/70 text-rose-950 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-100"
            : "border-emerald-200 bg-emerald-50/70 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100"
        )}
      >
        {flagged.length > 0 ? <AlertTriangle className="mt-0.5 size-5 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-5 shrink-0" />}
        <div className="text-sm leading-relaxed">
          {flagged.length > 0 ? (
            <>
              <strong>
                {flagged.length} protected class{flagged.length > 1 ? "es" : ""} below the four-fifths benchmark.
              </strong>{" "}
              A statistical disparity is not itself a finding of discrimination, but it obligates the operator to examine which criterion causes it,
              whether that criterion is necessary, and whether a less discriminatory alternative exists.
            </>
          ) : withData.length > 0 ? (
            <>
              <strong>No protected class falls below the four-fifths benchmark.</strong> Continue monitoring as the sample grows.
            </>
          ) : (
            <>Not enough decided applications to compare groups yet. Each group needs at least five determinations.</>
          )}
        </div>
      </div>

      {withData.length === 0 && disparateImpact.every((d) => d.groups.length === 0) ? (
        <EmptyState icon={BarChart3} title="No outcome data yet" description="Decide applications (or load the sample portfolio) to begin civil-rights monitoring." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {disparateImpact.map((di) => {
            const analysis = analyses.find((a) => a.protectedClass === di.protectedClass) ?? null;
            const insufficient = di.groups.length < 2;
            return (
              <Card key={di.protectedClass}>
                <CardHeaderRow
                  title={CLASS_LABELS[di.protectedClass] ?? humanize(di.protectedClass)}
                  description={
                    insufficient ? (
                      "Insufficient sample for comparison"
                    ) : (
                      <>
                        Impact ratio <span className="font-semibold text-foreground tabular">{di.impactRatio.toFixed(3)}</span> · benchmark 0.800
                      </>
                    )
                  }
                  actions={
                    insufficient ? (
                      <Badge>Monitoring</Badge>
                    ) : di.hasPotentialDisparateImpact ? (
                      <Badge tone="danger">
                        <AlertTriangle />
                        Potential disparate impact
                      </Badge>
                    ) : (
                      <Badge tone="success">
                        <CheckCircle2 />
                        Within benchmark
                      </Badge>
                    )
                  }
                />
                <CardContent>
                  <FairnessChart groups={di.groups} />
                  {di.hasPotentialDisparateImpact &&
                    (latestReport ? (
                      <BurdenShiftingPanel
                        key={analysis?.id ?? "new"}
                        disparityReportId={latestReport.id}
                        protectedClass={di.protectedClass}
                        impactRatio={di.impactRatio}
                        existing={analysis}
                        canEdit={ctx.accessTier === "FULL"}
                      />
                    ) : (
                      <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                        Issue a disparity report to open the burden-shifting analysis for this class.
                      </p>
                    ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeaderRow icon={FileBarChart} title="Disparity reports" description="Point-in-time reports preserved for the administrative record." />
        {reports.length === 0 ? (
          <CardContent className="text-sm text-muted-foreground">No reports issued yet.</CardContent>
        ) : (
          <ul className="divide-y">
            {reports.map((report) => (
              <li key={report.id}>
                <Link href={`/dashboard/fairness/reports/${report.id}`} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-muted/40 sm:px-6">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{report.summary ?? "Disparity report"}</p>
                    <p className="text-xs text-muted-foreground">
                      Period {formatDate(report.periodStart)} – {formatDate(report.periodEnd)} · issued {formatDate(report.reportDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={report.status} />
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
