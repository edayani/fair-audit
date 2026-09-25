import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthContextSafe, getDbUserId, isPlatformAdmin } from "@/lib/auth";
import { AccessTierProvider } from "@/components/providers/access-tier-provider";
import { AppProviders } from "@/components/providers/app-providers";
import { AppShell } from "@/components/layout/app-shell";
import { OrgOnboarding } from "@/components/onboarding/org-onboarding";
import { clerkAppearance } from "@/lib/clerk-appearance";

export const dynamic = "force-dynamic";
// Server actions inherit this budget (e.g., loading the sample portfolio).
export const maxDuration = 60;

export const metadata: Metadata = {
  title: { default: "Workspace", template: "%s · FairAudit" },
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const ctx = await getAuthContextSafe();

  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      appearance={clerkAppearance}
    >
      <AppProviders>{ctx ? <Workspace ctx={ctx}>{children}</Workspace> : <OrgOnboarding />}</AppProviders>
    </ClerkProvider>
  );
}

async function Workspace({
  ctx,
  children,
}: {
  ctx: NonNullable<Awaited<ReturnType<typeof getAuthContextSafe>>>;
  children: React.ReactNode;
}) {
  const [pendingReviews, newAlerts, isAdmin] = await Promise.all([
    prisma.decision.count({ where: { outcome: "PENDING_REVIEW", application: { organizationId: ctx.orgId } } }),
    prisma.driftAlert.count({ where: { organizationId: ctx.orgId, status: "NEW" } }),
    isPlatformAdmin(),
    // Keep a local User row in sync (reviewer attribution, admin roster)
    getDbUserId().catch((error) => console.error("Failed to sync user record", error)),
  ]);

  return (
    <AccessTierProvider accessTier={ctx.accessTier}>
      <AppShell counts={{ pendingReviews, newAlerts }} accessTier={ctx.accessTier} isAdmin={isAdmin}>
        {children}
      </AppShell>
    </AccessTierProvider>
  );
}
