import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { ArrowLeft } from "lucide-react";
import { isPlatformAdmin } from "@/lib/auth";
import { AppProviders } from "@/components/providers/app-providers";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Platform admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isPlatformAdmin())) redirect("/dashboard");
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;

  return (
    <AppProviders>
      <div className="min-h-screen bg-background">
        <nav className="border-b bg-card">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-4" />
                <span className="hidden sm:inline">Workspace</span>
              </Link>
              <Logo />
              <Badge tone="brand">Platform admin</Badge>
            </div>
            <span className="hidden text-xs text-muted-foreground sm:inline">{email}</span>
          </div>
        </nav>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </AppProviders>
  );
}
