import Link from "next/link";
import { FileText, Search } from "lucide-react";
import { getApplications } from "@/actions/application";
import { getProperties } from "@/actions/property";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { OutcomeBadge, StatusBadge, Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/form";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Applications" };

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; outcome?: string; property?: string }>;
}) {
  const { q, outcome, property } = await searchParams;
  const [applications, properties] = await Promise.all([
    getApplications({ q, outcome, propertyId: property }),
    getProperties(),
  ]);
  const filtered = Boolean(q || outcome || property);

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Applications"
        description="Every screening application across the portfolio, with its determination and procedural status."
      />

      <form method="get" className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center" role="search">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Search applicants by name or email" className="pl-9" aria-label="Search applicants" />
        </div>
        <Select name="outcome" defaultValue={outcome ?? ""} className="sm:w-48" aria-label="Filter by outcome">
          <option value="">All outcomes</option>
          <option value="PENDING_REVIEW">Pending review</option>
          <option value="APPROVED">Approved</option>
          <option value="CONDITIONAL">Conditional</option>
          <option value="DENIED">Denied</option>
          <option value="UNDECIDED">Undecided</option>
        </Select>
        <Select name="property" defaultValue={property ?? ""} className="sm:w-56" aria-label="Filter by property">
          <option value="">All properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <div className="flex gap-2">
          <Button type="submit" variant="secondary">
            Apply
          </Button>
          {filtered && (
            <Link href="/dashboard/applications" className={buttonVariants({ variant: "ghost" })}>
              Clear
            </Link>
          )}
        </div>
      </form>

      {applications.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={filtered ? "No applications match these filters" : "No applications yet"}
          description={filtered ? "Try a different search or clear the filters." : "Applications appear here once they're created or the sample portfolio is loaded."}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <tr>
                <TH>Applicant</TH>
                <TH className="hidden sm:table-cell">Property</TH>
                <TH>Determination</TH>
                <TH className="hidden md:table-cell">Status</TH>
                <TH className="hidden lg:table-cell">Signals</TH>
                <TH className="hidden text-right sm:table-cell">Applied</TH>
              </tr>
            </THead>
            <TBody>
              {applications.map((app) => (
                <TR key={app.id}>
                  <TD>
                    <Link href={`/dashboard/applications/${app.id}`} className="font-medium hover:text-primary hover:underline">
                      {app.applicant.firstName} {app.applicant.lastName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      <span className="sm:hidden">{app.property.name} · </span>
                      {app.hasVoucher ? app.voucherType ?? "Voucher holder" : app.applicant.sourceOfIncome ?? "—"}
                    </p>
                  </TD>
                  <TD className="hidden text-muted-foreground sm:table-cell">{app.property.name}</TD>
                  <TD>
                    <OutcomeBadge outcome={app.decision?.outcome} />
                  </TD>
                  <TD className="hidden md:table-cell">
                    <StatusBadge status={app.status} />
                  </TD>
                  <TD className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      <Badge>{app._count.screeningRecords} records</Badge>
                      {app._count.challenges > 0 && <Badge tone="warning">{app._count.challenges} challenge{app._count.challenges > 1 ? "s" : ""}</Badge>}
                      {app.decision && app.decision.reasonCodes.length > 0 && <Badge tone="brand">{app.decision.reasonCodes.length} reasons</Badge>}
                    </div>
                  </TD>
                  <TD className="hidden whitespace-nowrap text-right text-muted-foreground sm:table-cell">{formatDate(app.submittedAt)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <div className="border-t px-5 py-3 text-xs text-muted-foreground sm:px-6">
            {applications.length} application{applications.length === 1 ? "" : "s"}
            {filtered ? " matching filters" : ""}
          </div>
        </Card>
      )}
    </div>
  );
}
