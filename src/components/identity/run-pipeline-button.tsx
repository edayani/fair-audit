"use client";
// Spec §4.C, §4.D, §4.G — identity resolution → relevance labeling → determination
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { resolveIdentity } from "@/actions/identity";
import { labelApplicationRelevance } from "@/actions/relevance";
import { runDecision } from "@/actions/decision";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";

export function RunPipelineButton({ applicationId, hasDecision }: { applicationId: string; hasDecision?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleRun() {
    startTransition(async () => {
      const id = toast.loading("Resolving identities…");
      const idResult = await resolveIdentity(applicationId);
      if (!idResult.success) {
        toast.error(idResult.error ?? "Identity resolution failed", { id });
        return;
      }

      toast.loading(`Identity resolved (${idResult.data?.quarantined ?? 0} quarantined). Labeling relevance…`, { id });
      const relResult = await labelApplicationRelevance(applicationId);
      if (!relResult.success) {
        toast.error(relResult.error ?? "Relevance labeling failed", { id });
        return;
      }

      toast.loading("Evaluating against the published policy…", { id });
      const decResult = await runDecision(applicationId);
      if (!decResult.success) {
        toast.error(decResult.error ?? "Evaluation failed", { id });
        return;
      }
      toast.success("Determination issued with reason codes", { id });
      router.refresh();
    });
  }

  return (
    <Button onClick={handleRun} loading={isPending}>
      {!isPending && <Play />}
      {hasDecision ? "Re-run pipeline" : "Run screening pipeline"}
    </Button>
  );
}
