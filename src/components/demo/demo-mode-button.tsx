"use client";

import { useState, useTransition } from "react";
import { seedDemoData } from "@/actions/demo";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export function DemoModeButton() {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  function handleSeed() {
    startTransition(async () => {
      const result = await seedDemoData();
      if (result.success) {
        toast.success("Demo data created! 20 applicants with screening records, decisions, and more.");
        setShowConfirm(false);
        window.location.reload();
      } else {
        toast.error(result.error ?? "Failed to create demo data");
      }
    });
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Populate demo data?</span>
        <button onClick={handleSeed} disabled={isPending} className="inline-flex items-center rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {isPending ? "Seeding..." : "Yes, seed"}
        </button>
        <button onClick={() => setShowConfirm(false)} className="inline-flex items-center rounded-md border px-3 py-1 text-xs">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="inline-flex items-center gap-1.5 rounded-md border border-dashed px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
    >
      <Sparkles className="h-3.5 w-3.5" />
      Demo Mode
    </button>
  );
}
