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
      <div className="pointer-events-none opacity-40 select-none" aria-hidden>
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-lg backdrop-blur-[2px]">
        <div className="text-center px-4">
          <Lock className="h-5 w-5 mx-auto mb-1.5 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            {label ?? "Full access required"}
          </p>
          <Link
            href="/dashboard/settings"
            className="text-xs text-primary hover:underline"
          >
            Request access
          </Link>
        </div>
      </div>
    </div>
  );
}
