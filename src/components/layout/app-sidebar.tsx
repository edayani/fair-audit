"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/brand/logo";
import { NAV_GROUPS, isNavItemActive, type NavBadgeKey } from "./nav";

export interface SidebarProps {
  counts: Partial<Record<NavBadgeKey, number>>;
  accessTier: "PREVIEW" | "FULL";
  isAdmin: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
}

export function AppSidebar({ counts, accessTier, isAdmin, onNavigate, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border px-5">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onNavigate}>
          <LogoMark className="size-7 text-sidebar-accent" />
          <span className="font-serif text-lg font-semibold tracking-tight text-white">FairAudit</span>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-sidebar-muted hover:bg-sidebar-accent hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4" aria-label="Primary">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5 last:mb-0">
            <p className="mb-1.5 px-2.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted/80">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isNavItemActive(item, pathname);
                const count = item.badge ? counts[item.badge] ?? 0 : 0;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13.5px] transition-colors",
                        active
                          ? "bg-sidebar-accent font-medium text-white"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-white"
                      )}
                    >
                      {active && <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-brass" aria-hidden />}
                      <item.icon className={cn("size-4 shrink-0", active ? "text-brass" : "text-sidebar-muted group-hover:text-white")} />
                      <span className="truncate">{item.label}</span>
                      {count > 0 && (
                        <span className="ml-auto rounded-full bg-brass/90 px-1.5 py-px text-[10.5px] font-semibold text-ink tabular">
                          {count > 99 ? "99+" : count}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-2 border-t border-sidebar-border p-3">
        {isAdmin && (
          <Link
            href="/admin/requests"
            onClick={onNavigate}
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white"
          >
            <ShieldCheck className="size-4 text-brass" />
            Platform admin
          </Link>
        )}
        <div className="rounded-lg bg-sidebar-accent/70 px-3 py-2.5">
          <div className="flex items-center gap-2 text-xs font-medium text-white">
            <span className={cn("size-1.5 rounded-full", accessTier === "FULL" ? "bg-emerald-400" : "bg-amber-400")} />
            {accessTier === "FULL" ? "Full access" : "Preview workspace"}
          </div>
          <p className="mt-0.5 text-[11px] leading-snug text-sidebar-muted">
            {accessTier === "FULL" ? "Determinations are recorded to the audit trail." : "Explore with sample data. Writes are locked."}
          </p>
        </div>
      </div>
    </div>
  );
}
