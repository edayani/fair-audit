import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, BookOpenText, FileJson, Gavel, UserCheck } from "lucide-react";
import { getDecision } from "@/actions/decision";
import { getAuthContext } from "@/lib/auth";
import { IndividualizedAssessment } from "@/components/review/individualized-assessment";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeaderRow } from "@/components/ui/card";
import { SeverityBadge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatDateTime, getOutcomeSurface, humanize } from "@/lib/utils";

export const metadata = { title: "Determination" };

export default async function DecisionPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  const [decision, ctx] = await Promise.all([getDecision(applicationId), getAuthContext()]);

  if (!decision) {
    return (
      <EmptyState
        icon={Gavel}
        title="No determination has been issued"
        description="Run the screening pipeline from the records tab. Each determination is issued against the property's published policy and carries a reason code for every adverse factor."
      >
        <Link href={`/dashboard/applications/${applicationId}/records`} className={buttonVariants()}>
          Go to screening records
        </Link>
      </EmptyState>
    );
  }
  if (!decision.screeningPolicy) notFound();

  const involvesCriminal = decision.reasonCodes.some((rc) => rc.category === "Criminal");
  const evalData = decision.evaluationData as { overallScore?: number; reviewReasons?: string[] } | null;

  return (
    <div className="space-y-6">
      <div className={cn("rounded-xl border p-5 sm:p-6", getOutcomeSurface(decision.outcome))}>
        <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Determination</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl font-semibold">{humanize(decision.outcome)}</h2>
            <p className="mt-1 text-sm opacity-80">
              {decision.isAutomatic ? "Issued automatically" : "Routed to human review"} · engine confidence{" "}
              {decision.confidenceScore?.toFixed(1) ?? "—"}% · {formatDateTime(decision.decidedAt)}
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="opacity-70">Governing policy</p>
            <p className="font-medium">
              {decision.screeningPolicy.name} · v{decision.screeningPolicy.version}
            </p>
          </div>
        </div>
        {evalData?.reviewReasons && evalData.reviewReasons.length > 0 && (
          <ul className="mt-4 list-disc space-y-1 border-t border-current/10 pl-5 pt-4 text-sm">
            {evalData.reviewReasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
      </div>

      <Card>
        <CardHeaderRow
          icon={BookOpenText}
          title="Statement of reasons"
          description="Plain-language reason codes, each traceable to a published policy criterion — the basis of the adverse-action notice."
        />
        {decision.reasonCodes.length === 0 ? (
          <CardContent className="text-sm text-muted-foreground">
            No adverse factors. The application satisfied every criterion in the governing policy.
          </CardContent>
        ) : (
          <ol className="divide-y">
            {decision.reasonCodes.map((rc, i) => (
              <li key={rc.id} className="px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-serif text-sm text-muted-foreground">{i + 1}.</span>
                  <span className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-xs font-semibold">{rc.code}</span>
                  <span className="text-sm font-semibold">{rc.shortText}</span>
                  <SeverityBadge severity={rc.severity} className="ml-auto" />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{rc.detailedText}</p>
                {rc.policyRule && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Policy criterion: <span className="font-medium text-foreground">{rc.policyRule.label}</span>
                    {rc.policyRule.mitigationAllowed ? " · mitigation permitted" : ""}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </Card>

      {involvesCriminal && (
        <IndividualizedAssessment decisionId={decision.id} existing={decision.individualizedAssessment} canEdit={ctx.accessTier === "FULL"} />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeaderRow icon={UserCheck} title="Human review" />
          <CardContent className="text-sm">
            {decision.humanReview ? (
              <div className="space-y-2">
                <p>
                  <span className="text-muted-foreground">Action: </span>
                  <span className="font-medium">{humanize(decision.humanReview.action)}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Reviewer: </span>
                  {decision.humanReview.reviewer.name ?? decision.humanReview.reviewer.email}
                </p>
                {decision.humanReview.notes && <p className="rounded-lg bg-muted px-3 py-2 leading-relaxed">{decision.humanReview.notes}</p>}
                <p className="text-xs text-muted-foreground">{formatDateTime(decision.humanReview.reviewedAt)}</p>
              </div>
            ) : decision.outcome === "PENDING_REVIEW" ? (
              <div className="space-y-3">
                <p className="text-muted-foreground">This determination is awaiting a qualified reviewer.</p>
                <Link href="/dashboard/review-queue" className={buttonVariants({ size: "sm" })}>
                  Open review queue
                </Link>
              </div>
            ) : (
              <p className="text-muted-foreground">Automatic determination — no review was required by the policy.</p>
            )}
          </CardContent>
        </Card>

        <Card className={decision.override ? "border-orange-300 dark:border-orange-800/60" : undefined}>
          <CardHeaderRow icon={AlertTriangle} title="Override" />
          <CardContent className="text-sm">
            {decision.override ? (
              <div className="space-y-2">
                <p>
                  <span className="font-medium">{humanize(decision.override.originalOutcome)}</span> →{" "}
                  <span className="font-medium">{humanize(decision.override.newOutcome)}</span>
                </p>
                <p className="rounded-lg bg-muted px-3 py-2 leading-relaxed">{decision.override.justification}</p>
                <p className="text-xs text-muted-foreground">
                  {decision.override.overriddenBy.name ?? decision.override.overriddenBy.email} · {formatDateTime(decision.override.overriddenAt)}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">No override. Overrides require a written justification and are preserved as evidence.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {decision.evaluationData != null && (
        <details className="group rounded-xl border bg-card">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-sm font-medium sm:px-6">
            <FileJson className="size-4 text-muted-foreground" />
            Machine-readable evaluation record
            <span className="ml-auto text-xs text-muted-foreground group-open:hidden">Show</span>
          </summary>
          <pre className="max-h-96 overflow-auto border-t bg-muted/40 px-5 py-4 font-mono text-xs leading-relaxed sm:px-6">
            {JSON.stringify(decision.evaluationData, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
