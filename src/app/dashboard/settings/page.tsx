import Link from "next/link";
import { ArrowRight, Building, Gavel, Landmark, ShieldCheck } from "lucide-react";
import { getAccessRequestStatus } from "@/actions/access-request";
import { getComplianceMode } from "@/actions/jurisdiction";
import { COMPLIANCE_MODE_DESCRIPTIONS } from "@/lib/constants/jurisdictions";
import { PageHeader } from "@/components/shared/page-header";
import { AccessRequestCard } from "@/components/settings/access-request-card";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [accessStatus, { complianceMode }] = await Promise.all([getAccessRequestStatus(), getComplianceMode()]);

  const links = [
    {
      href: "/dashboard/settings/compliance",
      icon: Gavel,
      title: "Governing legal standard",
      body: `Currently: ${COMPLIANCE_MODE_DESCRIPTIONS[complianceMode as keyof typeof COMPLIANCE_MODE_DESCRIPTIONS]?.label ?? complianceMode}`,
    },
    { href: "/dashboard/jurisdictions", icon: Landmark, title: "Jurisdictions & rule overlays", body: "Federal, state, and local rules applied to each property" },
    { href: "/dashboard/audit-log", icon: ShieldCheck, title: "Audit trail", body: "Every material action, attributed and time-stamped" },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader eyebrow="Administration" title="Settings" description="Organization access, governing standard, and record-keeping." />

      <AccessRequestCard accessTier={accessStatus.accessTier} hasPendingRequest={accessStatus.hasPendingRequest} requestedAt={accessStatus.requestedAt} />

      <div className="grid gap-4 md:grid-cols-3">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="group rounded-xl border bg-card p-5 transition-all hover:-translate-y-px hover:border-primary/25 hover:shadow-md">
            <l.icon className="size-5 text-primary" />
            <h3 className="mt-3 font-semibold">{l.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{l.body}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
              Open <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>

      <div className="flex items-start gap-3 rounded-xl border bg-card p-5">
        <Building className="mt-0.5 size-5 text-muted-foreground" />
        <div>
          <h3 className="font-semibold">Organization & members</h3>
          <p className="text-sm text-muted-foreground">
            Manage the organization name, members, and roles from the organization switcher in the top bar. Every member&apos;s
            actions are attributed to them in the audit trail.
          </p>
        </div>
      </div>
    </div>
  );
}
