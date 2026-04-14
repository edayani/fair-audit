import { ClerkProvider } from "@clerk/nextjs";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getAuthContextSafe } from "@/lib/auth";
import { ensureOrganization } from "@/actions/settings";
import { AccessTierProvider } from "@/components/providers/access-tier-provider";
import { AppProviders } from "@/components/providers/app-providers";
import { PreviewBanner } from "@/components/shared/preview-banner";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Ensure the Clerk org has a matching DB record on every dashboard load
  const ctx = await getAuthContextSafe();
  if (ctx) {
    await ensureOrganization();
  }

  const accessTier = ctx?.accessTier ?? "PREVIEW";

  return (
    <ClerkProvider
      proxyUrl={process.env.NEXT_PUBLIC_CLERK_PROXY_URL ?? "/__clerk"}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <AppProviders>
        <AccessTierProvider accessTier={accessTier}>
          <div className="flex h-screen overflow-hidden">
            <AppSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Topbar />
              <main className="flex-1 overflow-y-auto p-6">
                <PreviewBanner />
                {children}
              </main>
            </div>
          </div>
        </AccessTierProvider>
      </AppProviders>
    </ClerkProvider>
  );
}
