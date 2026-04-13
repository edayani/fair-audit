import { getApplication } from "@/actions/application";
import { getDecision } from "@/actions/decision";
import { PageHeader } from "@/components/shared/page-header";
import { IndividualizedAssessment } from "@/components/review/individualized-assessment";
import { formatDate, humanize, getOutcomeColor, getSeverityColor } from "@/lib/utils";
import { Shield, User, AlertTriangle } from "lucide-react";

export default async function DecisionPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  const app = await getApplication(applicationId);
  // Use getDecision to include individualizedAssessment
  const decisionWithAssessment = await getDecision(applicationId);
  const decision = app.decision;

  if (!decision) {
    return (
      <div>
        <PageHeader title="Decision" description="No decision has been made for this application yet. Run the screening pipeline from the Records page." />
      </div>
    );
  }

  const evalData = decision.evaluationData as Record<string, unknown> | null;

  return (
    <div>
      <PageHeader title="Decision & Explainability" description="Spec §4.G — Every decision must be explainable, reviewable, and logged" />
      <div className={`rounded-lg border p-6 mb-6 ${getOutcomeColor(decision.outcome)}`}>
        <div className="flex items-center gap-3 mb-3">
          <Shield className="h-8 w-8" />
          <div>
            <h2 className="text-2xl font-bold">{humanize(decision.outcome)}</h2>
            <p className="text-sm">Confidence: {decision.confidenceScore?.toFixed(1)}% | {decision.isAutomatic ? "Automatic" : "Requires review"}</p>
          </div>
        </div>
        <p className="text-sm">Decision date: {formatDate(decision.decidedAt)} | Policy: {decision.screeningPolicy.name} v{decision.screeningPolicy.version}</p>
      </div>

      <div className="rounded-lg border bg-card p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Reason Codes</h3>
        {decision.reasonCodes.length === 0 ? (
          <p className="text-muted-foreground">No adverse reason codes (application approved).</p>
        ) : (
          <div className="space-y-3">
            {decision.reasonCodes.map((rc) => (
              <div key={rc.id} className="border rounded-md p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">{rc.code} — {rc.category}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getSeverityColor(rc.severity)}`}>{rc.severity}</span>
                </div>
                <p className="text-sm font-medium">{rc.shortText}</p>
                <p className="text-sm text-muted-foreground mt-1">{rc.detailedText}</p>
                {rc.policyRule && <p className="text-xs text-muted-foreground mt-2">Policy rule: {rc.policyRule.label}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {decision.reasonCodes.some((rc) => rc.category === "Criminal" || rc.code.startsWith("CM-")) && (
        <div className="mb-6">
          <IndividualizedAssessment
            decisionId={decision.id}
            existing={decisionWithAssessment?.individualizedAssessment ?? null}
            readOnly
          />
        </div>
      )}

      {decision.humanReview && (
        <div className="rounded-lg border bg-card p-6 mb-6">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><User className="h-5 w-5" /> Human Review</h3>
          <p className="text-sm"><span className="font-medium">Reviewer:</span> {decision.humanReview.reviewer.name ?? decision.humanReview.reviewer.email}</p>
          <p className="text-sm"><span className="font-medium">Action:</span> {humanize(decision.humanReview.action)}</p>
          {decision.humanReview.notes && <p className="text-sm mt-1"><span className="font-medium">Notes:</span> {decision.humanReview.notes}</p>}
          <p className="text-xs text-muted-foreground mt-2">{formatDate(decision.humanReview.reviewedAt)}</p>
        </div>
      )}

      {decision.override && (
        <div className="rounded-lg border border-orange-300 bg-orange-50 dark:bg-orange-900/20 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-orange-600" /> Override</h3>
          <p className="text-sm">{humanize(decision.override.originalOutcome)} → {humanize(decision.override.newOutcome)}</p>
          <p className="text-sm mt-1"><span className="font-medium">Justification:</span> {decision.override.justification}</p>
          <p className="text-xs text-muted-foreground mt-2">By {decision.override.overriddenBy.name ?? decision.override.overriddenBy.email} on {formatDate(decision.override.overriddenAt)}</p>
        </div>
      )}

      {evalData && (
        <details className="rounded-lg border bg-card p-6">
          <summary className="cursor-pointer font-semibold">Raw Evaluation Data</summary>
          <pre className="mt-4 text-xs overflow-auto max-h-96 p-4 bg-muted rounded">{JSON.stringify(evalData, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}
