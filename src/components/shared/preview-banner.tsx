"use client";

import Link from "next/link";
import { Eye, ArrowRight } from "lucide-react";
import { useAccessTier } from "@/components/providers/access-tier-provider";

export function PreviewBanner() {
  const accessTier = useAccessTier();
  if (accessTier === "FULL") return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 mb-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Eye className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
            Preview Mode
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            You&apos;re viewing FairAudit with demo data. Write actions are locked until access is approved.
          </p>
        </div>
      </div>
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 flex-shrink-0"
      >
        Request Access
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
