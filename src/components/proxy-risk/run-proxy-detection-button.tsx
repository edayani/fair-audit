"use client";
// Spec §4.E — LLM use case 3: proxy-risk flagging, human approval required
import { useTransition } from "react";
import { runProxyDetection } from "@/actions/proxy-risk";
import { toast } from "@/lib/toast";
import { Layers } from "lucide-react";

export function RunProxyDetectionButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button onClick={() => startTransition(async () => {
      const result = await runProxyDetection();
      if (result.success) toast.success(`Proxy detection complete: ${result.data?.flagged} features flagged`);
      else toast.error(result.error ?? "Failed");
    })} disabled={isPending} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
      <Layers className="h-4 w-4" /> {isPending ? "Detecting..." : "Run Detection"}
    </button>
  );
}
