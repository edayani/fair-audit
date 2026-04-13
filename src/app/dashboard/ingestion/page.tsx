import { getIngestionStats } from "@/actions/ingestion";
import { PageHeader } from "@/components/shared/page-header";
import Link from "next/link";
import { Upload, Database, AlertTriangle } from "lucide-react";
import { humanize } from "@/lib/utils";

export default async function IngestionPage() {
  const stats = await getIngestionStats();

  return (
    <div>
      <PageHeader title="Data Ingestion" description="Screening data normalization and quality (Spec §4.B)">
        <Link href="/dashboard/ingestion/upload" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Upload className="h-4 w-4" /> Upload Data
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">Total Records</p><p className="text-2xl font-bold">{stats.total}</p></div>
        <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">Quarantined</p><p className="text-2xl font-bold text-yellow-600">{stats.quarantined}</p></div>
        <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">Missing Disposition</p><p className="text-2xl font-bold text-red-600">{stats.missingDisposition}</p></div>
        <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">Vendors</p><p className="text-2xl font-bold">{Object.keys(stats.byVendor).length}</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Database className="h-5 w-5" /> Records by Type</h3>
          {Object.entries(stats.byType).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-sm">{humanize(type)}</span>
              <span className="font-medium">{count as number}</span>
            </div>
          ))}
          {Object.keys(stats.byType).length === 0 && <p className="text-sm text-muted-foreground">No records</p>}
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Upload className="h-5 w-5" /> Records by Vendor</h3>
          {Object.entries(stats.byVendor).map(([vendor, count]) => (
            <div key={vendor} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-sm">{vendor}</span>
              <span className="font-medium">{count as number}</span>
            </div>
          ))}
          {Object.keys(stats.byVendor).length === 0 && <p className="text-sm text-muted-foreground">No vendors</p>}
        </div>
      </div>
    </div>
  );
}
