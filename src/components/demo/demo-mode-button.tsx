"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, TriangleAlert } from "lucide-react";
import { seedDemoData } from "@/actions/demo";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { useAccessTier } from "@/components/providers/access-tier-provider";

export function DemoModeButton({ variant = "compact" }: { variant?: "compact" | "hero" }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const accessTier = useAccessTier();

  function handleSeed() {
    startTransition(async () => {
      const result = await seedDemoData();
      if (result.success) {
        toast.success("Sample portfolio loaded", {
          description: "3 properties, 20 applicants, decisions, challenges, notices, and analytics.",
        });
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to load sample data");
      }
    });
  }

  return (
    <>
      {variant === "hero" ? (
        <Button size="lg" onClick={() => setOpen(true)}>
          <Sparkles />
          Load sample portfolio
        </Button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="hidden items-center gap-1.5 rounded-lg border border-dashed px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground sm:inline-flex"
        >
          <Sparkles className="size-3.5 text-brass" />
          Sample data
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="demo-title">
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => !isPending && setOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
              <TriangleAlert className="size-5" />
            </div>
            <h2 id="demo-title" className="font-serif text-xl font-semibold">Load the sample portfolio?</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              This creates three affordable and supportive housing properties with twenty applicants, screening records,
              decisions, challenges, notices, and civil-rights analytics.
            </p>
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
              <strong>This replaces all properties, applications, and analytics in this workspace.</strong>
              {accessTier === "FULL" ? " Your workspace has full access — only continue if it holds no real data." : ""} The
              audit trail and evidence vault are append-only and are never erased.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button onClick={handleSeed} loading={isPending}>
                {isPending ? "Loading…" : "Load sample data"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
