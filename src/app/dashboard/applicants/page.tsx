import Link from "next/link";
import { Users } from "lucide-react";
import { getApplicants } from "@/actions/application";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDate, initials } from "@/lib/utils";

export const metadata = { title: "Applicants" };

export default async function ApplicantsPage() {
  const applicants = await getApplicants();

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Applicants"
        description="People who have applied across the portfolio. Contact data is scoped to your organization and never shared across tenants."
      />
      {applicants.length === 0 ? (
        <EmptyState icon={Users} title="No applicants yet" description="Applicants appear here as applications are received or when the sample portfolio is loaded." />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <tr>
                <TH>Name</TH>
                <TH className="hidden md:table-cell">Email</TH>
                <TH className="hidden sm:table-cell">Source of income</TH>
                <TH>Applications</TH>
                <TH className="text-right">Added</TH>
              </tr>
            </THead>
            <TBody>
              {applicants.map((a) => (
                <TR key={a.id}>
                  <TD>
                    <Link href={`/dashboard/applicants/${a.id}`} className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                        {initials(`${a.firstName} ${a.lastName}`)}
                      </span>
                      <span className="font-medium hover:text-primary hover:underline">
                        {a.firstName} {a.lastName}
                      </span>
                    </Link>
                  </TD>
                  <TD className="hidden text-muted-foreground md:table-cell">{a.email ?? "—"}</TD>
                  <TD className="hidden sm:table-cell">
                    {a.sourceOfIncome ? <Badge tone={/voucher|vash|assistance/i.test(a.sourceOfIncome) ? "brand" : "neutral"}>{a.sourceOfIncome}</Badge> : "—"}
                  </TD>
                  <TD className="tabular">{a._count.applications}</TD>
                  <TD className="text-right text-muted-foreground">{formatDate(a.createdAt)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
