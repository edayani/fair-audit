"use client";
// Spec §4.H — Human review action card
import { useState, useTransition } from "react";
import { submitReview, submitOverride } from "@/actions/review";
import { toast } from "@/lib/toast";
import { humanize, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Scale } from "lucide-react";

interface ReviewCardProps {
  decision: {
    id: string;
    outcome: string;
    confidenceScore: number | null;
    createdAt: Date;
    application: { id: string; applicant: { firstName: string; lastName: string }; property: { name: string } };
    reasonCodes: Array<{ code: string; shortText: string; category?: string }>;
  };
  hasAssessment?: boolean;
}

export function ReviewCard({ decision, hasAssessment }: ReviewCardProps) {
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState("");
  const [showOverride, setShowOverride] = useState(false);
  const [overrideOutcome, setOverrideOutcome] = useState<"APPROVED" | "DENIED" | "CONDITIONAL">("APPROVED");
  const [justification, setJustification] = useState("");

  function handleReview(action: "APPROVE" | "DENY" | "ESCALATE" | "REQUEST_INFO") {
    if (!notes.trim()) { toast.error("Notes are required"); return; }
    startTransition(async () => {
      const result = await submitReview(decision.id, action, notes);
      if (result.success) toast.success(`Review: ${action}`);
      else toast.error(result.error ?? "Failed");
    });
  }

  function handleOverride() {
    if (!justification.trim()) { toast.error("Justification required"); return; }
    startTransition(async () => {
      const result = await submitOverride(decision.id, overrideOutcome, justification);
      if (result.success) toast.success("Override applied");
      else toast.error(result.error ?? "Failed");
    });
  }

  const hasCriminalHistory = decision.reasonCodes.some(
    (rc) => rc.category === "Criminal" || rc.code.startsWith("CM-")
  );
  const actionsDisabled = hasCriminalHistory && !hasAssessment;

  return (
    <div className="rounded-lg border bg-card p-6">
      {hasCriminalHistory && (
        <div className="mb-4 p-3 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-900/20">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <Scale className="h-4 w-4" />
            This decision involves criminal history and requires an individualized assessment per HUD guidance before review action.
          </p>
        </div>
      )}
      <div className="flex items-start justify-between mb-4">
        <div>
          <Link href={`/dashboard/applications/${decision.application.id}`} className="text-lg font-semibold hover:underline">
            {decision.application.applicant.firstName} {decision.application.applicant.lastName}
          </Link>
          <p className="text-sm text-muted-foreground">{decision.application.property.name} | Confidence: {decision.confidenceScore?.toFixed(0)}%</p>
        </div>
        <span className="text-xs text-muted-foreground">{formatDate(decision.createdAt)}</span>
      </div>

      {decision.reasonCodes.length > 0 && (
        <div className="mb-4 space-y-1">
          {decision.reasonCodes.map((rc) => <p key={rc.code} className="text-sm"><span className="font-medium">{rc.code}:</span> {rc.shortText}</p>)}
        </div>
      )}

      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Review notes (required)..." rows={2} className="w-full rounded-md border bg-background px-3 py-2 text-sm mb-3" />

      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => handleReview("APPROVE")} disabled={isPending || actionsDisabled} className="rounded-md bg-green-600 text-white px-4 py-2 text-sm hover:bg-green-700 disabled:opacity-50">Approve</button>
        <button onClick={() => handleReview("DENY")} disabled={isPending || actionsDisabled} className="rounded-md bg-red-600 text-white px-4 py-2 text-sm hover:bg-red-700 disabled:opacity-50">Deny</button>
        <button onClick={() => handleReview("REQUEST_INFO")} disabled={isPending || actionsDisabled} className="rounded-md border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50">Request Info</button>
        <button onClick={() => setShowOverride(!showOverride)} className="rounded-md border border-orange-300 text-orange-600 px-4 py-2 text-sm hover:bg-orange-50 dark:hover:bg-orange-900/20">Override</button>
      </div>

      {showOverride && (
        <div className="mt-4 p-4 border border-orange-200 rounded-md bg-orange-50/50 dark:bg-orange-900/10 space-y-3">
          <p className="text-sm font-medium text-orange-700 dark:text-orange-400">Override requires detailed justification and is logged to the audit trail.</p>
          <select value={overrideOutcome} onChange={(e) => setOverrideOutcome(e.target.value as typeof overrideOutcome)} className="rounded-md border bg-background px-3 py-2 text-sm">
            <option value="APPROVED">Override to Approved</option>
            <option value="DENIED">Override to Denied</option>
            <option value="CONDITIONAL">Override to Conditional</option>
          </select>
          <textarea value={justification} onChange={(e) => setJustification(e.target.value)} placeholder="Detailed justification for override..." rows={2} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
          <button onClick={handleOverride} disabled={isPending} className="rounded-md bg-orange-600 text-white px-4 py-2 text-sm hover:bg-orange-700 disabled:opacity-50">Apply Override</button>
        </div>
      )}
    </div>
  );
}
