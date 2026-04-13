"use client";
// Spec §4.J — Adverse-action notice generator
import { useState, useTransition } from "react";
import { generateNotice } from "@/actions/notice";
import { toast } from "sonner";
import { FileOutput } from "lucide-react";

export function GenerateNoticeButton({ applicationId }: { applicationId: string }) {
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<"ADVERSE_ACTION" | "CONDITIONAL_APPROVAL" | "CORRECTION">("ADVERSE_ACTION");

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateNotice(applicationId, type);
      if (result.success) toast.success("Notice generated");
      else toast.error(result.error ?? "Failed");
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="rounded-md border bg-background px-3 py-2 text-sm">
        <option value="ADVERSE_ACTION">Adverse Action</option>
        <option value="CONDITIONAL_APPROVAL">Conditional Approval</option>
        <option value="CORRECTION">Correction</option>
      </select>
      <button onClick={handleGenerate} disabled={isPending} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
        <FileOutput className="h-4 w-4" /> {isPending ? "Generating..." : "Generate Notice"}
      </button>
    </div>
  );
}
