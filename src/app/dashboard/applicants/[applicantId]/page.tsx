import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import { getApplicant } from "@/actions/application";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeaderRow } from "@/components/ui/card";
import { OutcomeBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Applicant" };

export default async function ApplicantDetailPage({ params }: { params: Promise<{ applicantId: string }> }) {
  const { applicantId } = await params;
  const applicant = await getApplicant(applicantId);
  if (!applicant) notFound();

  const facts = [
    { label: "Email", value: applicant.email ?? "—" },
    { label: "Phone", value: applicant.phone ?? "—" },
    { label: "Date of birth", value: formatDate(applicant.dateOfBirth) },
    { label: "Source of income", value: applicant.sourceOfIncome ?? "—" },
  ];

  return (
    <div>
      <PageHeader
        back={{ href: "/dashboard/applicants", label: "All applicants" }}
        eyebrow="Applicant profile"
        title={`${applicant.firstName} ${applicant.lastName}`}
        description={`${applicant.applications.length} application${applicant.applications.length === 1 ? "" : "s"} on file`}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeaderRow title="Applications" />
          <ul className="divide-y">
            {applicant.applications.map((app) => (
              <li key={app.id}>
                <Link href={`/dashboard/applications/${app.id}`} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/40 sm:px-6">
                  <div>
                    <p className="text-sm font-medium">{app.property.name}</p>
                    <p className="text-xs text-muted-foreground">Applied {formatDate(app.submittedAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <OutcomeBadge outcome={app.decision?.outcome} />
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeaderRow title="Contact & profile" />
          <CardContent className="space-y-3 text-sm">
            {facts.map((f) => (
              <div key={f.label} className="flex justify-between gap-4">
                <span className="text-muted-foreground">{f.label}</span>
                <span className="text-right font-medium">{f.value}</span>
              </div>
            ))}
            <p className="flex gap-2 border-t pt-3 text-xs leading-relaxed text-muted-foreground">
              <Lock className="mt-0.5 size-3.5 shrink-0" />
              Protected-class information is held separately for civil-rights monitoring and is excluded from every screening evaluation.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
