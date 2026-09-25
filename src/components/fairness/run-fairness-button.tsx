"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { runFairnessAnalysis } from "@/actions/fairness";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";

export function RunFairnessButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleRun() {
    startTransition(async () => {
      const result = await runFairnessAnalysis();
      if (result.success) {
        toast.success("Disparity report issued for the last 90 days");
        router.refresh();
      } else {
        toast.error(result.error ?? "Analysis failed");
      }
    });
  }

  return (
    <Button onClick={handleRun} loading={isPending}>
      {!isPending && <BarChart3 />}
      Issue disparity report
    </Button>
  );
}
