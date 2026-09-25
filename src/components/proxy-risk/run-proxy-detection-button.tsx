"use client";
// Spec §4.E — proxy-risk detection across registered features
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Radar } from "lucide-react";
import { runProxyDetection } from "@/actions/proxy-risk";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";

export function RunProxyDetectionButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleRun() {
    startTransition(async () => {
      const result = await runProxyDetection();
      if (result.success) {
        toast.success(`Detection complete — ${result.data?.flagged ?? 0} feature(s) flagged as potential proxies`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Detection failed");
      }
    });
  }

  return (
    <Button onClick={handleRun} loading={isPending}>
      {!isPending && <Radar />}
      Run proxy detection
    </Button>
  );
}
