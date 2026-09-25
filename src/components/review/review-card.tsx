"use client";
// Spec §4.H — Human review action card
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, CircleHelp, Scale, ShieldAlert, X } from "lucide-react";
import { submitOverride, submitReview } from "@/actions/review";
import { toast } from "@/lib/toast";
import { formatDate, timeAgo } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";

interface ReviewCardProps {
  decision: {
    id: string;
    outcome: string;
    confidenceScore: number | null;
    createdAt: Date;
    application: { id: string; hasVoucher: boolean; applicant: { firstName: string; lastName: string }; property: { name: string } };
    reasonCodes: Array<{ id: string; code: string; shortText: string; category?: string }>;
  };
  hasAssessment?: boolean;
  canAct: boolean;
}

export function ReviewCard({ decision, hasAssessment, canAct }: ReviewCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState("");
  const [showOverride, setShowOverride] = useState(false);
  const [overrideOutcome, setOverrideOutcome] = useState<"APPROVED" | "DENIED" | "CONDITIONAL">("APPROVED");
  const [justification, setJustification] = useState("");

  const involvesCriminal = decision.reasonCodes.some((rc) => rc.category === "Criminal");
  const finalBlocked = involvesCriminal && !hasAssessment;
  const decisionHref = `/dashboard/applications/${decision.application.id}/decision`;

  function handleReview(action: "APPROVE" | "DENY" | "ESCALATE" | "REQUEST_INFO") {
    if (!notes.trim()) {
      toast.error("Reviewer notes are required for the record.");
      return;
    }
    startTransition(async () => {
      const result = await submitReview(decision.id, action, notes);
      if (result.success) {
        toast.success(action === "APPROVE" ? "Approved" : action === "DENY" ? "Denied — generate the adverse-action notice next" : "Recorded");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  function handleOverride() {
    startTransition(async () => {
      const result = await submitOverride(decision.id, overrideOutcome, justification);
      if (result.success) {
        toast.success("Override recorded with justification");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4 sm:px-6">
        <div>
          <Link href={`/dashboard/applications/${decision.application.id}`} className="font-serif text-lg font-semibold hover:text-primary hover:underline">
            {decision.application.applicant.firstName} {decision.application.applicant.lastName}
          </Link>
          <p className="text-sm text-muted-foreground">
            {decision.application.property.name}
            {decision.application.hasVoucher ? " · voucher holder" : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
          <span title={formatDate(decision.createdAt)}>Waiting {timeAgo(decision.createdAt).replace(" ago", "")}</span>
          <span>Engine confidence {decision.confidenceScore?.toFixed(0) ?? "—"}%</span>
        </div>
      </div>

      <div className="space-y-4 px-5 py-4 sm:px-6">
        {involvesCriminal && (
          <div
            className={
              hasAssessment
                ? "flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                : "flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
            }
          >
            <Scale className="mt-0.5 size-4 shrink-0" />
            <div className="flex-1">
              {hasAssessment
                ? "Individualized assessment on file."
                : "Criminal history is at issue. HUD guidance requires an individualized assessment before a final determination."}
            </div>
            {!hasAssessment && (
              <Link href={decisionHref} className="shrink-0 font-medium underline-offset-2 hover:underline">
                Complete assessment
              </Link>
            )}
          </div>
        )}

        {decision.reasonCodes.length > 0 && (
          <ul className="space-y-1.5">
            {decision.reasonCodes.map((rc) => (
              <li key={rc.id} className="flex items-start gap-2 text-sm">
                <Badge tone="outline" className="font-mono">
                  {rc.code}
                </Badge>
                <span>{rc.shortText}</span>
              </li>
            ))}
          </ul>
        )}

        {canAct ? (
          <>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reviewer findings and reasoning (required, becomes part of the record)…" rows={2} />
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="success" size="sm" onClick={() => handleReview("APPROVE")} disabled={isPending || finalBlocked}>
                <Check />
                Approve
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleReview("DENY")} disabled={isPending || finalBlocked}>
                <X />
                Deny
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleReview("REQUEST_INFO")} disabled={isPending}>
                <CircleHelp />
                Request information
              </Button>
              <Button variant="warning" size="sm" onClick={() => setShowOverride((v) => !v)} className="sm:ml-auto">
                <ShieldAlert />
                Override
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
            Review actions unlock with full access.
            <Link href={decisionHref} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              View rationale
              <ArrowRight />
            </Link>
          </div>
        )}

        {showOverride && canAct && (
          <div className="space-y-3 rounded-lg border border-orange-200 bg-orange-50/60 p-4 dark:border-orange-900/60 dark:bg-orange-950/20">
            <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
              Overrides depart from the published policy. State the specific, articulable reason — it is preserved verbatim.
            </p>
            <Select value={overrideOutcome} onChange={(e) => setOverrideOutcome(e.target.value as typeof overrideOutcome)} className="sm:w-60">
              <option value="APPROVED">Override to approved</option>
              <option value="CONDITIONAL">Override to conditional</option>
              <option value="DENIED">Override to denied</option>
            </Select>
            <Textarea value={justification} onChange={(e) => setJustification(e.target.value)} placeholder="Written justification (min. 20 characters)…" rows={2} />
            <Button size="sm" onClick={handleOverride} loading={isPending} className="bg-orange-600 text-white hover:bg-orange-700">
              Apply override
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
