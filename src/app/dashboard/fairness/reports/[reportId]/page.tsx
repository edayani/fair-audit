import { getDisparityReport } from "@/actions/fairness";
import { PageHeader } from "@/components/shared/page-header";
import { formatDate, humanize } from "@/lib/utils";

export default async function DisparityReportPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const report = await getDisparityReport(reportId);

  return (
    <div>
      <PageHeader title="Disparity Report" description={`${formatDate(report.periodStart)} - ${formatDate(report.periodEnd)}`} />
      <div className="rounded-lg border bg-card p-6 mb-6">
        <p className="text-sm mb-2"><span className="font-medium">Status:</span> {humanize(report.status)}</p>
        {report.summary && <p className="text-sm text-muted-foreground">{report.summary}</p>}
      </div>
      <details className="rounded-lg border bg-card p-6">
        <summary className="cursor-pointer font-semibold">Full Report Data</summary>
        <pre className="mt-4 text-xs overflow-auto max-h-96 p-4 bg-muted rounded">{JSON.stringify(report.findings, null, 2)}</pre>
      </details>
    </div>
  );
}
