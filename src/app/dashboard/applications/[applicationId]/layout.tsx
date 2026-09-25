import { notFound } from "next/navigation";
import { Building2, CalendarDays, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { TabNav } from "@/components/shared/tab-nav";
import { OutcomeBadge, StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function ApplicationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  const { orgId } = await getAuthContext();

  const app = await prisma.application.findFirst({
    where: { id: applicationId, organizationId: orgId },
    select: {
      id: true,
      status: true,
      submittedAt: true,
      monthlyIncome: true,
      hasVoucher: true,
      voucherType: true,
      applicant: { select: { firstName: true, lastName: true } },
      property: { select: { name: true } },
      decision: { select: { outcome: true } },
      _count: { select: { screeningRecords: true, challenges: true, notices: true, accommodations: true } },
      challenges: { where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } }, select: { id: true } },
      accommodations: { where: { status: "PENDING" }, select: { id: true } },
    },
  });
  if (!app) notFound();

  const base = `/dashboard/applications/${applicationId}`;
  const tabs = [
    { href: base, label: "Summary", exact: true },
    { href: `${base}/records`, label: "Screening records", count: app._count.screeningRecords },
    { href: `${base}/decision`, label: "Determination" },
    { href: `${base}/challenge`, label: "Challenges", count: app._count.challenges, attention: app.challenges.length > 0 },
    { href: `${base}/accommodation`, label: "Accommodations", count: app._count.accommodations, attention: app.accommodations.length > 0 },
    { href: `${base}/notice`, label: "Notices", count: app._count.notices },
  ];

  return (
    <div>
      <PageHeader
        back={{ href: "/dashboard/applications", label: "All applications" }}
        eyebrow="Application case file"
        title={
          <span className="flex flex-wrap items-center gap-3">
            {app.applicant.firstName} {app.applicant.lastName}
            <OutcomeBadge outcome={app.decision?.outcome} className="font-sans text-[13px]" />
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="size-3.5" />
              {app.property.name}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              Applied {formatDate(app.submittedAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Wallet className="size-3.5" />
              {formatCurrency(app.monthlyIncome)}/mo
              {app.hasVoucher ? ` · ${app.voucherType ?? "Housing voucher"}` : ""}
            </span>
            <StatusBadge status={app.status} />
          </span>
        }
        className="mb-4 sm:mb-5"
      />
      <TabNav tabs={tabs} className="mb-6" />
      {children}
    </div>
  );
}
