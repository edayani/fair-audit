import { notFound } from "next/navigation";
import Link from "next/link";
import { Ban, FileSearch, ShieldAlert, ShieldCheck, ShieldQuestion, ShieldX, Upload } from "lucide-react";
import { getApplication } from "@/actions/application";
import { RunPipelineButton } from "@/components/identity/run-pipeline-button";
import { PreviewGate } from "@/components/shared/preview-gate";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatCurrency, formatDate, humanize } from "@/lib/utils";

export const metadata = { title: "Screening records" };

const RELEVANCE: Record<string, { tone: BadgeTone; label: string; icon: React.ComponentType<{ className?: string }> }> = {
  RELEVANT: { tone: "danger", label: "Relevant to tenancy", icon: ShieldAlert },
  CONDITIONAL: { tone: "warning", label: "Conditional", icon: ShieldQuestion },
  IRRELEVANT: { tone: "success", label: "Not relevant", icon: ShieldCheck },
  PROHIBITED: { tone: "violet", label: "Prohibited by law", icon: Ban },
};

export default async function RecordsPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  const app = await getApplication(applicationId);
  if (!app) notFound();

  const quarantined = app.screeningRecords.filter((r) => r.isQuarantined).length;
  const excluded = app.screeningRecords.filter((r) => r.relevance === "IRRELEVANT" || r.relevance === "PROHIBITED").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Consumer report data</h2>
          <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
            Each record is matched to the applicant, tested for accuracy, and labeled for relevance to tenancy before it can
            influence a determination. Irrelevant or legally prohibited records are excluded from evaluation.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Badge>{app.screeningRecords.length} records</Badge>
            <Badge tone={quarantined ? "warning" : "neutral"}>{quarantined} quarantined</Badge>
            <Badge tone={excluded ? "success" : "neutral"}>{excluded} excluded from evaluation</Badge>
          </div>
        </div>
        <PreviewGate label="Full access required to run the pipeline">
          <RunPipelineButton applicationId={applicationId} hasDecision={!!app.decision} />
        </PreviewGate>
      </div>

      {app.screeningRecords.length === 0 ? (
        <EmptyState icon={FileSearch} title="No screening records" description="Ingest vendor data (credit, eviction, criminal, rental history) to evaluate this application.">
          <Link href="/dashboard/ingestion/upload" className={buttonVariants()}>
            <Upload />
            Ingest vendor data
          </Link>
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {app.screeningRecords.map((record) => {
            const rel = record.relevance ? RELEVANCE[record.relevance] : null;
            const Icon = rel?.icon ?? ShieldX;
            return (
              <Card key={record.id} className={cn("p-5", record.isQuarantined && "border-amber-300 dark:border-amber-700/70")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-secondary">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{humanize(record.recordType)}</p>
                      <p className="text-xs text-muted-foreground">
                        {record.vendorName}
                        {record.dateOccurred ? ` · ${formatDate(record.dateOccurred)}` : ""}
                      </p>
                    </div>
                  </div>
                  {rel ? <Badge tone={rel.tone}>{rel.label}</Badge> : <Badge>Unlabeled</Badge>}
                </div>

                {record.summary && <p className="mt-3 text-sm leading-relaxed">{record.summary}</p>}

                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  {record.disposition && (
                    <>
                      <dt className="text-muted-foreground">Disposition</dt>
                      <dd className="text-right font-medium">{record.disposition}</dd>
                    </>
                  )}
                  {record.amount != null && (
                    <>
                      <dt className="text-muted-foreground">Amount</dt>
                      <dd className="text-right font-medium">{formatCurrency(record.amount)}</dd>
                    </>
                  )}
                  {record.identityConfidence != null && (
                    <>
                      <dt className="text-muted-foreground">Identity match</dt>
                      <dd
                        className={cn(
                          "text-right font-medium tabular",
                          record.identityConfidence >= 80 ? "text-emerald-600 dark:text-emerald-400" : record.identityConfidence >= 60 ? "text-amber-600" : "text-rose-600"
                        )}
                      >
                        {record.identityConfidence.toFixed(0)}%
                      </dd>
                    </>
                  )}
                </dl>

                {record.relevanceReason && (
                  <p className="mt-3 border-t pt-3 text-xs italic leading-relaxed text-muted-foreground">{record.relevanceReason}</p>
                )}
                {record.isQuarantined && (
                  <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                    <strong>Quarantined:</strong> {record.quarantineReason ?? "Failed data-quality checks"}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
