import { getApplications } from "@/actions/application";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import Link from "next/link";
import { formatDate, getOutcomeColor, humanize } from "@/lib/utils";

export default async function ApplicationsPage() {
  const applications = await getApplications();

  return (
    <div>
      <PageHeader title="Applications" description="All screening applications across properties" />
      {applications.length === 0 ? (
        <EmptyState title="No applications" description="Applications will appear here once applicants apply or demo data is seeded." />
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Applicant</th>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Property</th>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Decision</th>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Date</th>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Records</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-b hover:bg-muted/50">
                  <td className="p-4">
                    <Link href={`/dashboard/applications/${app.id}`} className="font-medium hover:underline">
                      {app.applicant.firstName} {app.applicant.lastName}
                    </Link>
                  </td>
                  <td className="p-4 text-muted-foreground">{app.property.name}</td>
                  <td className="p-4"><span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs">{humanize(app.status)}</span></td>
                  <td className="p-4">
                    {app.decision ? (
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${getOutcomeColor(app.decision.outcome)}`}>
                        {humanize(app.decision.outcome)}
                      </span>
                    ) : <span className="text-muted-foreground text-xs">Pending</span>}
                  </td>
                  <td className="p-4 text-muted-foreground">{formatDate(app.createdAt)}</td>
                  <td className="p-4 text-muted-foreground">{app._count.screeningRecords}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
