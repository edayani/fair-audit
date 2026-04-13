"use client";
// Spec §4.C, §4.D — Run identity resolution and relevance labeling pipeline
import { useTransition } from "react";
import { resolveIdentity } from "@/actions/identity";
import { labelApplicationRelevance } from "@/actions/relevance";
import { runDecision } from "@/actions/decision";
import { toast } from "sonner";
import { Play } from "lucide-react";

export function RunPipelineButton({ applicationId }: { applicationId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleRun() {
    startTransition(async () => {
      toast.info("Running screening pipeline...");
      const idResult = await resolveIdentity(applicationId);
      if (!idResult.success) { toast.error(idResult.error); return; }
      toast.info(`Identity resolved: ${idResult.data?.processed} records, ${idResult.data?.quarantined} quarantined`);

      const relResult = await labelApplicationRelevance(applicationId);
      if (!relResult.success) { toast.error(relResult.error); return; }
      toast.info(`Relevance labeled: ${relResult.data?.labeled} records`);

      const decResult = await runDecision(applicationId);
      if (!decResult.success) { toast.error(decResult.error); return; }
      toast.success("Pipeline complete! Decision generated.");
    });
  }

  return (
    <button onClick={handleRun} disabled={isPending} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
      <Play className="h-4 w-4" /> {isPending ? "Running..." : "Run Pipeline"}
    </button>
  );
}
