import { getApplication } from "@/actions/application";
import { PageHeader } from "@/components/shared/page-header";
import { RunPipelineButton } from "@/components/identity/run-pipeline-button";
import { formatDate, humanize, getSeverityColor } from "@/lib/utils";
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

export default async function RecordsPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  const app = await getApplication(applicationId);

  const relevanceIcon = (label: string | null) => {
    switch (label) {
      case "RELEVANT": return <ShieldCheck className="h-4 w-4 text-red-500" />;
      case "IRRELEVANT": return <ShieldX className="h-4 w-4 text-green-500" />;
      case "CONDITIONAL": return <ShieldAlert className="h-4 w-4 text-yellow-500" />;
      default: return <ShieldAlert className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div>
      <PageHeader title="Screening Records" description="Data ingestion, identity resolution, and relevance labeling (Spec §4.B, §4.C, §4.D)">
        <RunPipelineButton applicationId={applicationId} />
      </PageHeader>

      {app.screeningRecords.length === 0 ? (
        <p className="text-muted-foreground">No screening records. Use Demo Mode or upload vendor data.</p>
      ) : (
        <div className="space-y-3">
          {app.screeningRecords.map((record) => (
            <div key={record.id} className={`rounded-lg border p-4 ${record.isQuarantined ? "border-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10" : ""}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {relevanceIcon(record.relevance)}
                  <div>
                    <span className="font-medium text-sm">{humanize(record.recordType)}</span>
                    <span className="text-xs text-muted-foreground ml-2">via {record.vendorName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {record.identityConfidence != null && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${record.identityConfidence >= 80 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : record.identityConfidence >= 60 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                      ID: {record.identityConfidence}%
                    </span>
                  )}
                  {record.relevance && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${record.relevance === "RELEVANT" ? getSeverityColor("HIGH") : record.relevance === "IRRELEVANT" ? getSeverityColor("LOW") : getSeverityColor("MEDIUM")}`}>
                      {humanize(record.relevance)}
                    </span>
                  )}
                </div>
              </div>
              {record.summary && <p className="text-sm text-muted-foreground mt-2">{record.summary}</p>}
              {record.disposition && <p className="text-sm mt-1"><span className="text-muted-foreground">Disposition:</span> {record.disposition}</p>}
              {record.isQuarantined && (
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">Quarantined: {record.quarantineReason}</div>
              )}
              {record.relevanceReason && <p className="text-xs text-muted-foreground mt-2 italic">{record.relevanceReason}</p>}
              <p className="text-xs text-muted-foreground mt-2">{formatDate(record.dateOccurred)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
