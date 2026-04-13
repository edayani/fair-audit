"use client";

import Link from "next/link";
import { OrganizationSwitcher, UserButton, useUser } from "@clerk/nextjs";
import { ThemeToggle } from "./theme-toggle";
import { DemoModeButton } from "@/components/demo/demo-mode-button";
import { ShieldCheck } from "lucide-react";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export function Topbar() {
  const { user } = useUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  const isAdmin = ADMIN_EMAIL && email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
      </div>
      <div className="flex items-center gap-3">
        {isAdmin && (
          <Link
            href="/admin/requests"
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin
          </Link>
        )}
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
