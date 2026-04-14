"use client";
import { useTransition } from "react";
import { runFairnessAnalysis } from "@/actions/fairness";
import { toast } from "@/lib/toast";
import { BarChart3 } from "lucide-react";

export function RunFairnessButton() {
  const [isPending, startTransition] = useTransition();

  function handleRun() {
    startTransition(async () => {
      const result = await runFairnessAnalysis();
      if (result.success) {
        toast.success("Fairness analysis complete");
      } else {
        toast.error(result.error ?? "Analysis failed");
      }
    });
  }

  return (
    <button onClick={handleRun} disabled={isPending} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
      <BarChart3 className="h-4 w-4" /> {isPending ? "Analyzing..." : "Run Analysis"}
    </button>
  );
}
