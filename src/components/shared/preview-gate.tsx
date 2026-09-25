"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useAccessTier } from "@/components/providers/access-tier-provider";
import type { ReactNode } from "react";

export function PreviewGate({
  children,
  label,
}: {
  children: ReactNode;
  label?: string;
}) {
  const accessTier = useAccessTier();
  if (accessTier === "FULL") return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-40" aria-hidden inert>
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-[2px]">
        <div className="rounded-xl border bg-card px-5 py-4 text-center shadow-sm">
          <Lock className="mx-auto mb-1.5 size-4 text-muted-foreground" />
          <p className="text-sm font-medium">{label ?? "Full access required"}</p>
          <Link href="/dashboard/settings" className="text-xs font-medium text-primary hover:underline">
            Request access
          </Link>
        </div>
      </div>
    </div>
  );
}
