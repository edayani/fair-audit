import { getApplication } from "@/actions/application";
import { PageHeader } from "@/components/shared/page-header";
import Link from "next/link";
import { formatDate, formatCurrency, getOutcomeColor, humanize } from "@/lib/utils";
import { FileText, Shield, AlertTriangle, MessageSquare, FileOutput, Accessibility } from "lucide-react";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  const app = await getApplication(applicationId);

  const tabs = [
    { href: `/dashboard/applications/${applicationId}/records`, icon: FileText, label: "Records", count: app.screeningRecords.length },
    { href: `/dashboard/applications/${applicationId}/decision`, icon: Shield, label: "Decision", active: !!app.decision },
    { href: `/dashboard/applications/${applicationId}/challenge`, icon: MessageSquare, label: "Challenges", count: app.challenges.length },
    { href: `/dashboard/applications/${applicationId}/notice`, icon: FileOutput, label: "Notices", count: app.notices.length },
    { href: `/dashboard/applications/${applicationId}/accommodation`, icon: Accessibility, label: "Accommodations", count: app.accommodations.length },
  ];

  return (
    <div>
      <PageHeader title={`${app.applicant.firstName} ${app.applicant.lastName}`} description={`Application for ${app.property.name}`} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Status</p>
          <p className="font-semibold">{humanize(app.status)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Monthly Income</p>
          <p className="font-semibold">{formatCurrency(app.monthlyIncome)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Voucher</p>
          <p className="font-semibold">{app.hasVoucher ? `Yes (${app.voucherType ?? "Type unspecified"})` : "No"}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Applied</p>
          <p className="font-semibold">{formatDate(app.submittedAt)}</p>
        </div>
      </div>

      {app.decision && (
        <div className={`rounded-lg border p-4 mb-6 ${getOutcomeColor(app.decision.outcome)}`}>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5" />
            <span className="font-semibold text-lg">Decision: {humanize(app.decision.outcome)}</span>
          </div>
          {app.decision.reasonCodes.length > 0 && (
            <div className="mt-2 space-y-1">
              {app.decision.reasonCodes.map((rc) => (
                <p key={rc.id} className="text-sm"><span className="font-medium">{rc.code}:</span> {rc.shortText}</p>
              ))}
            </div>
          )}
          {app.decision.override && (
            <div className="mt-2 flex items-center gap-1 text-sm"><AlertTriangle className="h-4 w-4" /> Overridden: {humanize(app.decision.override.originalOutcome)} → {humanize(app.decision.override.newOutcome)}</div>
          )}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <Link key={tab.href} href={tab.href} className="inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm hover:bg-muted transition-colors">
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.count !== undefined && <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-xs">{tab.count}</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
