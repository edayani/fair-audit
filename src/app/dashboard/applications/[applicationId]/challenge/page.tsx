import { notFound } from "next/navigation";
import { MessageSquareWarning } from "lucide-react";
import { getApplication } from "@/actions/application";
import { ChallengeForm, ChallengeResolver } from "@/components/challenge/challenge-form";
import { PreviewGate } from "@/components/shared/preview-gate";
import { Card } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { formatDate, humanize } from "@/lib/utils";

export const metadata = { title: "Challenges" };

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Filed",
  UNDER_REVIEW: "Under review",
  RESOLVED_ACCEPTED: "Sustained",
  RESOLVED_REJECTED: "Denied",
};

export default async function ChallengePage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  const app = await getApplication(applicationId);
  if (!app) notFound();

  const recordLabel = new Map(app.screeningRecords.map((r) => [r.id, `${humanize(r.recordType)} · ${r.vendorName}`]));

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
      <div className="space-y-4">
        <div>
          <h2 className="font-semibold">Challenge docket</h2>
          <p className="text-sm text-muted-foreground">Disputes of accuracy, relevance, and mitigation, each resolved in writing.</p>
        </div>
        {app.challenges.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed bg-card/50 px-6 py-12 text-center">
            <MessageSquareWarning className="mb-3 size-6 text-muted-foreground" />
            <p className="text-sm font-medium">No challenges filed</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">Applicants can dispute any record considered in their determination.</p>
          </div>
        ) : (
          app.challenges.map((c) => {
            const open = c.status === "SUBMITTED" || c.status === "UNDER_REVIEW";
            return (
              <Card key={c.id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge tone="brand">{humanize(c.type)}</Badge>
                    <StatusBadge status={c.status} label={STATUS_LABELS[c.status]} />
                  </div>
                  <span className="text-xs text-muted-foreground">Filed {formatDate(c.submittedAt)}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed">{c.description}</p>
                {c.mitigatingEvidence && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Evidence offered: </span>
                    {c.mitigatingEvidence}
                  </p>
                )}
                {c.recordIds.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.recordIds.map((id) => (
                      <Badge key={id}>{recordLabel.get(id) ?? "Record"}</Badge>
                    ))}
                  </div>
                )}
                {c.resolution && (
                  <div className="mt-3 rounded-lg border-l-2 border-primary/40 bg-muted/50 px-3 py-2 text-sm">
                    <span className="font-medium">Resolution: </span>
                    {c.resolution}
                    {c.resolvedAt && <span className="block text-xs text-muted-foreground">{formatDate(c.resolvedAt)}{c.resolvedBy ? ` · ${c.resolvedBy}` : ""}</span>}
                  </div>
                )}
                {open && (
                  <div className="mt-3 flex justify-end">
                    <PreviewGate label="Full access required">
                      <ChallengeResolver challengeId={c.id} />
                    </PreviewGate>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      <PreviewGate label="Full access required to file challenges">
        <ChallengeForm
          applicationId={applicationId}
          records={app.screeningRecords.map((r) => ({ id: r.id, recordType: r.recordType, vendorName: r.vendorName }))}
        />
      </PreviewGate>
    </div>
  );
}
