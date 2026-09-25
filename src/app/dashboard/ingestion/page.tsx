import Link from "next/link";
import { AlertTriangle, Database, FileWarning, Upload, Waypoints } from "lucide-react";
import { getIngestionStats } from "@/actions/ingestion";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeaderRow } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { humanize } from "@/lib/utils";

export const metadata = { title: "Data intake" };

function Breakdown({ entries }: { entries: Array<[string, number]> }) {
  const max = Math.max(1, ...entries.map(([, n]) => n));
  if (entries.length === 0) return <p className="text-sm text-muted-foreground">No records yet.</p>;
  return (
    <div className="space-y-3">
      {entries
        .sort((a, b) => b[1] - a[1])
        .map(([label, count]) => (
          <div key={label}>
            <div className="mb-1 flex justify-between text-sm">
              <span>{label}</span>
              <span className="font-medium tabular">{count}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(count / max) * 100}%` }} />
            </div>
          </div>
        ))}
    </div>
  );
}

export default async function IngestionPage() {
  const stats = await getIngestionStats();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Adjudication"
        authority="FCRA § 607(b) · maximum possible accuracy"
        title="Data intake"
        description="Consumer-report data normalized from every vendor into one schema, with quality checks that quarantine stale, mismatched, or incomplete records before they can affect anyone."
      >
        <Link href="/dashboard/ingestion/upload" className={buttonVariants()}>
          <Upload />
          Ingest vendor data
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Records on file" value={stats.total} icon={Database} />
        <StatCard label="Quarantined" value={stats.quarantined} icon={AlertTriangle} tone={stats.quarantined ? "warning" : "default"} />
        <StatCard label="Missing disposition" value={stats.missingDisposition} icon={FileWarning} tone={stats.missingDisposition ? "danger" : "default"} hint="Criminal records without a final disposition" />
        <StatCard label="Vendors" value={Object.keys(stats.byVendor).length} icon={Waypoints} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeaderRow title="Records by type" />
          <CardContent>
            <Breakdown entries={Object.entries(stats.byType).map(([k, v]) => [humanize(k), v as number])} />
          </CardContent>
        </Card>
        <Card>
          <CardHeaderRow title="Records by vendor" />
          <CardContent>
            <Breakdown entries={Object.entries(stats.byVendor).map(([k, v]) => [k, v as number])} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
