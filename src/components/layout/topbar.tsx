"use client";

import { usePathname } from "next/navigation";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { ChevronRight, Menu } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { DemoModeButton } from "@/components/demo/demo-mode-button";
import { findNavContext } from "./nav";

export function Topbar({ onOpenNav }: { onOpenNav: () => void }) {
  const pathname = usePathname();
  const { group, item } = findNavContext(pathname);
  const isNested = item && pathname !== item.href;

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 sm:px-6">
      <button
        onClick={onOpenNav}
        className="-ml-1 rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </button>

      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm sm:flex">
        {group && <span className="text-muted-foreground">{group}</span>}
        {item && (
          <>
            <ChevronRight className="size-3.5 text-muted-foreground/60" />
            <span className={isNested ? "text-muted-foreground" : "font-medium text-foreground"}>{item.label}</span>
          </>
        )}
        {isNested && (
          <>
            <ChevronRight className="size-3.5 text-muted-foreground/60" />
            <span className="font-medium text-foreground">Detail</span>
          </>
        )}
      </nav>
      <span className="truncate text-sm font-medium sm:hidden">{item?.label ?? "FairAudit"}</span>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <DemoModeButton />
        <ThemeToggle />
        <div className="hidden md:block">
          <OrganizationSwitcher
            hidePersonal
            afterCreateOrganizationUrl="/dashboard"
            afterSelectOrganizationUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: "flex items-center",
                organizationSwitcherTrigger: "!rounded-lg !border !border-border !px-2.5 !py-1.5 !text-foreground hover:!bg-accent",
                organizationPreviewMainIdentifier: "!text-foreground",
              },
            }}
          />
        </div>
        <UserButton appearance={{ elements: { avatarBox: "!size-8" } }} />
      </div>
    </header>
  );
}
