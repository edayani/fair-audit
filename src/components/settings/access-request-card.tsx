"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Lock, Send } from "lucide-react";
import { submitAccessRequest } from "@/actions/access-request";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { formatDate } from "@/lib/utils";

export function AccessRequestCard({
  accessTier,
  hasPendingRequest,
  requestedAt,
}: {
  accessTier: string;
  hasPendingRequest: boolean;
  requestedAt: Date | null;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  if (accessTier === "FULL") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/30">
        <CheckCircle2 className="mt-0.5 size-5 text-emerald-600 dark:text-emerald-400" />
        <div>
          <h3 className="font-semibold">Full access</h3>
          <p className="text-sm text-muted-foreground">Your organization can record determinations, notices, overrides, and analyses to the legal record.</p>
        </div>
      </div>
    );
  }

  if (hasPendingRequest) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-900/60 dark:bg-amber-950/30">
        <Clock className="mt-0.5 size-5 text-amber-600" />
        <div>
          <h3 className="font-semibold">Access request under review</h3>
          <p className="text-sm text-muted-foreground">
            We&apos;ll upgrade the workspace once approved.{requestedAt ? ` Submitted ${formatDate(requestedAt)}.` : ""}
          </p>
        </div>
      </div>
    );
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitAccessRequest(reason);
      if (result.success) {
        toast.success("Access request submitted");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to submit request");
      }
    });
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-card p-5 dark:border-amber-900/60 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
          <Lock className="size-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Request full access</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Preview workspaces can explore every module with sample data. Full access enables recording determinations to the
            append-only audit trail and evidence vault.
          </p>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tell us about your portfolio — e.g., 1,200 units across LIHTC and permanent supportive housing in Los Angeles County (optional)"
            className="mb-3"
            maxLength={2000}
          />
          <Button onClick={handleSubmit} loading={isPending}>
            {!isPending && <Send />}
            Submit request
          </Button>
        </div>
      </div>
    </div>
  );
}
