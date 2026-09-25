"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar, type SidebarProps } from "./app-sidebar";
import { Topbar } from "./topbar";
import { PreviewBanner } from "@/components/shared/preview-banner";

type AppShellProps = Omit<SidebarProps, "onNavigate" | "onClose"> & { children: React.ReactNode };

export function AppShell({ children, ...sidebarProps }: AppShellProps) {
  const pathname = usePathname();
  // The drawer is open only for the route it was opened on, so navigating closes it
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const navOpen = openedAt === pathname;
  const setNavOpen = (open: boolean) => setOpenedAt(open ? pathname : null);

  // Lock page scroll while the drawer is open
  useEffect(() => {
    document.body.style.overflow = navOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [navOpen]);

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <AppSidebar {...sidebarProps} />
      </aside>

      {/* Mobile drawer */}
      <div className={navOpen ? "fixed inset-0 z-50 lg:hidden" : "hidden"} role="dialog" aria-modal="true" aria-label="Navigation">
        <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setNavOpen(false)} />
        <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl">
          <AppSidebar {...sidebarProps} onNavigate={() => setNavOpen(false)} onClose={() => setNavOpen(false)} />
        </aside>
      </div>

      <div className="flex min-h-screen flex-col lg:pl-64">
        <Topbar onOpenNav={() => setNavOpen(true)} />
        <main id="main" className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <PreviewBanner />
          {children}
        </main>
        <footer className="border-t px-4 py-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span>FairAudit supports compliance decision-making; it does not provide legal advice.</span>
            <span className="font-serif italic">Every determination explainable, reviewable, and preserved.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
