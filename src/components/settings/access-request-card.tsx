"use client";

import { useState } from "react";
import { submitAccessRequest } from "@/actions/access-request";
import { Lock, CheckCircle, Clock, Send } from "lucide-react";
import { toast } from "@/lib/toast";

export function AccessRequestCard({
  accessTier,
  hasPendingRequest,
  requestedAt,
}: {
  accessTier: string;
  hasPendingRequest: boolean;
  requestedAt: Date | null;
}) {
  const [reason, setReason] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [submitted, setSubmitted] = useState(hasPendingRequest);

  if (accessTier === "FULL") {
    return (
      <div className="rounded-lg border bg-card p-6 mb-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div>
            <h3 className="font-semibold">Full Access</h3>
            <p className="text-sm text-muted-foreground">
              Your organization has full access to all FairAudit features.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-6 mb-6">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-amber-600" />
          <div>
            <h3 className="font-semibold">Access Request Pending</h3>
            <p className="text-sm text-muted-foreground">
              Your request is being reviewed. You&apos;ll get full access once approved.
              {requestedAt && (
                <span className="block mt-1 text-xs">
                  Submitted {new Date(requestedAt).toLocaleDateString()}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  async function handleSubmit() {
    setIsPending(true);
    const result = await submitAccessRequest(reason);
    if (result.success) {
      setSubmitted(true);
      toast.success("Access request submitted!");
    } else {
      toast.error(result.error ?? "Failed to submit request");
    }
    setIsPending(false);
  }

  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-6 mb-6">
      <div className="flex items-start gap-3">
        <Lock className="h-6 w-6 text-amber-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold">Preview Mode</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You&apos;re viewing FairAudit with demo data. Request full access to unlock all features.
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tell us how you plan to use FairAudit (optional)..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm mb-3 min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {isPending ? "Submitting..." : "Request Full Access"}
          </button>
        </div>
      </div>
    </div>
  );
}
