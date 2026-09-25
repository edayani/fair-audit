"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Activity, Check, CheckCheck } from "lucide-react";
import { acknowledgeDriftAlert, resolveDriftAlert, runDriftDetection } from "@/actions/monitoring";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";

export function RunDriftButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleRun() {
    startTransition(async () => {
      const result = await runDriftDetection();
      if (result.success) {
        toast.success(`Detection complete — ${result.data?.alertsCreated ?? 0} new alert(s)`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Detection failed");
      }
    });
  }

  return (
    <Button onClick={handleRun} loading={isPending}>
      {!isPending && <Activity />}
      Run drift detection
    </Button>
  );
}

export function AlertActions({ alertId, status }: { alertId: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const [resolving, setResolving] = useState(false);
  const [resolution, setResolution] = useState("");
  const router = useRouter();

  function acknowledge() {
    startTransition(async () => {
      const result = await acknowledgeDriftAlert(alertId);
      if (result.success) {
        toast.success("Alert acknowledged");
        router.refresh();
      } else toast.error(result.error ?? "Failed");
    });
  }

  function resolve() {
    startTransition(async () => {
      const result = await resolveDriftAlert(alertId, resolution);
      if (result.success) {
        toast.success("Alert resolved");
        router.refresh();
      } else toast.error(result.error ?? "Failed");
    });
  }

  if (resolving) {
    return (
      <div className="mt-3 w-full space-y-2">
        <Textarea rows={2} value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Root cause and remediation taken…" />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setResolving(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button size="sm" onClick={resolve} loading={isPending}>
            Record resolution
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {status === "NEW" && (
        <Button variant="outline" size="sm" onClick={acknowledge} loading={isPending}>
          {!isPending && <Check />}
          Acknowledge
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={() => setResolving(true)} disabled={isPending}>
        <CheckCheck />
        Resolve
      </Button>
    </div>
  );
}
