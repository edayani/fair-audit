"use client";

import { useTransition } from "react";
import { generateAIA } from "@/actions/ai-governance";
import { toast } from "sonner";
import { Brain } from "lucide-react";

export function AIAGenerator() {
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateAIA();
      if (result.success) {
        toast.success("Algorithmic Impact Assessment generated successfully");
      } else {
        toast.error(result.error ?? "Failed to generate assessment");
      }
    });
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
    >
      <Brain className="h-4 w-4" />
      {isPending ? "Generating..." : "Generate AIA"}
    </button>
  );
}
