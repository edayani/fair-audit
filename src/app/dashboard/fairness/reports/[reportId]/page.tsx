import { notFound } from "next/navigation";
import { FileJson, Scale } from "lucide-react";
import { getDisparityReport } from "@/actions/fairness";
import { PageHeader } from "@/components/shared/page-header";
import { FairnessChart } from "@/components/fairness/fairness-chart";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeaderRow } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { formatDate, formatPercent, humanize } from "@/lib/utils";
import type { FairnessReport } from "@/lib/engines/fairness";

export const metadata = { title: "Disparity report" };

export default async function DisparityReportPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const report = await getDisparityReport(reportId);
  if (!report) notFound();

  const findings = report.findings as unknown as Partial<FairnessReport> | null;
  const results = findings?.disparateImpactResults ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: "/dashboard/fairness", label: "Disparate impact" }}
        eyebrow="Disparity report"
        title={`${formatDate(report.periodStart)} – ${formatDate(report.periodEnd)}`}
        description={report.summary ?? undefined}
      >
        <StatusBadge status={report.status} />
      </PageHeader>

      {findings && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Applications analyzed" value={findings.totalApplications ?? "—"} />
          <StatCard label="Overall approval rate" value={findings.overallApprovalRate != null ? formatPercent(findings.overallApprovalRate, 0) : "—"} />
          <StatCard label="Override rate" value={findings.overrideRate != null ? formatPercent(findings.overrideRate, 0) : "—"} />
          <StatCard label="Dispute success rate" value={findings.disputeSuccessRate != null ? formatPercent(findings.disputeSuccessRate, 0) : "—"} />
        </div>
      )}

      {results.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {results.map((r) => (
            <Card key={r.protectedClass}>
              <CardHeaderRow
                title={humanize(r.protectedClass)}
                description={`Impact ratio ${r.impactRatio.toFixed(3)}`}
                actions={r.hasPotentialDisparateImpact ? <Badge tone="danger">Below benchmark</Badge> : <Badge tone="success">Within benchmark</Badge>}
              />
              <CardContent>
                <FairnessChart groups={r.groups} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {report.burdenShiftingAnalyses.length > 0 && (
        <Card>
          <CardHeaderRow icon={Scale} title="Burden-shifting analyses" />
          <ul className="divide-y">
            {report.burdenShiftingAnalyses.map((a) => (
              <li key={a.id} className="px-5 py-4 text-sm sm:px-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{humanize(a.protectedClass)}</span>
                  {a.conclusion && <Badge tone={a.conclusion === "JUSTIFIED" ? "success" : a.conclusion === "UNJUSTIFIED" ? "danger" : "warning"}>{humanize(a.conclusion)}</Badge>}
                  <span className="ml-auto text-xs text-muted-foreground">{formatDate(a.analyzedAt)} · {a.analyzedBy}</span>
                </div>
                {a.legitimateObjectiveNotes && <p className="mt-2 text-muted-foreground">{a.legitimateObjectiveNotes}</p>}
                {a.lessDiscriminatoryAltNotes && <p className="mt-1 text-muted-foreground">Alternative: {a.lessDiscriminatoryAltNotes}</p>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <details className="group rounded-xl border bg-card">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-sm font-medium sm:px-6">
          <FileJson className="size-4 text-muted-foreground" />
          Full findings (machine-readable)
          <span className="ml-auto text-xs text-muted-foreground group-open:hidden">Show</span>
        </summary>
        <pre className="max-h-96 overflow-auto border-t bg-muted/40 px-5 py-4 font-mono text-xs sm:px-6">{JSON.stringify(report.findings, null, 2)}</pre>
      </details>
    </div>
  );
}
