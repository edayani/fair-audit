"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Eye } from "lucide-react";
import { useAccessTier } from "@/components/providers/access-tier-provider";

export function PreviewBanner() {
  const accessTier = useAccessTier();
  const pathname = usePathname();
  if (accessTier === "FULL" || pathname === "/dashboard/settings") return null;

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-amber-800/60 dark:bg-amber-950/30">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
          <Eye className="size-3.5" />
        </div>
        <div>
          <p className="text-sm font-medium text-amber-950 dark:text-amber-100">You&apos;re in a preview workspace</p>
          <p className="text-xs leading-relaxed text-amber-800/90 dark:text-amber-300/90">
            Load the sample portfolio to explore every module. Recording determinations, notices, and overrides unlocks with full access.
          </p>
        </div>
      </div>
      <Link
        href="/dashboard/settings"
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
      >
        Request full access
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}
