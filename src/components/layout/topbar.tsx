"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "./theme-toggle";
import { DemoModeButton } from "@/components/demo/demo-mode-button";

export function Topbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
      </div>
      <div className="flex items-center gap-3">
        <DemoModeButton />
        <ThemeToggle />
        <OrganizationSwitcher
          afterCreateOrganizationUrl="/dashboard"
          afterSelectOrganizationUrl="/dashboard"
          appearance={{ elements: { rootBox: "flex items-center" } }}
        />
        <UserButton />
      </div>
    </header>
  );
}
