"use client";
import { useTransition } from "react";
import { runDriftDetection } from "@/actions/monitoring";
import { toast } from "@/lib/toast";
import { Activity } from "lucide-react";

export function RunDriftButton() {
  const [isPending, startTransition] = useTransition();
  return (
    <button onClick={() => startTransition(async () => {
      const result = await runDriftDetection();
      if (result.success) toast.success(`Drift detection complete: ${result.data?.alertsCreated} new alerts`);
      else toast.error(result.error ?? "Failed");
    })} disabled={isPending} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
      <Activity className="h-4 w-4" /> {isPending ? "Detecting..." : "Run Detection"}
    </button>
  );
}
