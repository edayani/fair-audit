import { getApplicant } from "@/actions/application";
import { PageHeader } from "@/components/shared/page-header";
import Link from "next/link";
import { formatDate, humanize, getOutcomeColor } from "@/lib/utils";

export default async function ApplicantDetailPage({ params }: { params: Promise<{ applicantId: string }> }) {
  const { applicantId } = await params;
  const applicant = await getApplicant(applicantId);

  return (
    <div>
      <PageHeader title={`${applicant.firstName} ${applicant.lastName}`} description="Applicant profile and application history" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border bg-card p-4"><p className="text-xs text-muted-foreground">Email</p><p className="text-sm font-medium">{applicant.email ?? "N/A"}</p></div>
        <div className="rounded-lg border bg-card p-4"><p className="text-xs text-muted-foreground">Phone</p><p className="text-sm font-medium">{applicant.phone ?? "N/A"}</p></div>
        <div className="rounded-lg border bg-card p-4"><p className="text-xs text-muted-foreground">DOB</p><p className="text-sm font-medium">{formatDate(applicant.dateOfBirth)}</p></div>
        <div className="rounded-lg border bg-card p-4"><p className="text-xs text-muted-foreground">Applications</p><p className="text-sm font-medium">{applicant.applications.length}</p></div>
      </div>
      <h3 className="text-lg font-semibold mb-3">Applications</h3>
      <div className="space-y-2">
        {applicant.applications.map((app) => (
          <Link key={app.id} href={`/dashboard/applications/${app.id}`} className="flex items-center justify-between p-4 rounded-md border hover:bg-muted/50">
            <div>
              <p className="font-medium">{app.property.name}</p>
              <p className="text-sm text-muted-foreground">{formatDate(app.createdAt)}</p>
            </div>
            {app.decision && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${getOutcomeColor(app.decision.outcome)}`}>
                {humanize(app.decision.outcome)}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
