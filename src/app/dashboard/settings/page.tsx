import { PageHeader } from "@/components/shared/page-header";
import Link from "next/link";
import { Settings, Scale, Shield } from "lucide-react";
import { getAccessRequestStatus } from "@/actions/access-request";
import { AccessRequestCard } from "@/components/settings/access-request-card";

export default async function SettingsPage() {
  const accessStatus = await getAccessRequestStatus();

  return (
    <div>
      <PageHeader title="Settings" description="Organization configuration" />

      {/* Access Tier Card — shown prominently at top for PREVIEW orgs */}
      <AccessRequestCard
        accessTier={accessStatus.accessTier}
        hasPendingRequest={accessStatus.hasPendingRequest}
        requestedAt={accessStatus.requestedAt}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/dashboard/settings/compliance" className="rounded-lg border bg-card p-6 hover:shadow-md transition-shadow">
          <Scale className="h-8 w-8 text-primary mb-3" />
          <h3 className="font-semibold mb-1">Compliance Mode</h3>
          <p className="text-sm text-muted-foreground">Toggle between Federal+CA and Court-Only Disparate Impact modes</p>
        </Link>
        <div className="rounded-lg border bg-card p-6 opacity-75">
          <Shield className="h-8 w-8 text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">Organization Details</h3>
          <p className="text-sm text-muted-foreground">Manage organization settings via the Clerk organization switcher</p>
        </div>
      </div>
    </div>
  );
}
