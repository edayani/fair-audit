import { getProperty } from "@/actions/property";
import { PageHeader } from "@/components/shared/page-header";
import Link from "next/link";
import { formatDate, getOutcomeColor, humanize } from "@/lib/utils";
import { Settings, FileText, Users } from "lucide-react";

export default async function PropertyDetailPage({ params }: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = await params;
  const property = await getProperty(propertyId);

  return (
    <div>
      <PageHeader title={property.name} description={[property.address, property.city, property.state].filter(Boolean).join(", ")}>
        <Link href={`/dashboard/properties/${propertyId}/policy`} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Settings className="h-4 w-4" /> Screening Policy
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Applications</p>
          <p className="text-2xl font-bold">{property._count.applications}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Active Policy</p>
          <p className="text-2xl font-bold">{property.screeningPolicies.find((p) => p.isActive)?.name ?? "None"}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Units</p>
          <p className="text-2xl font-bold">{property.unitCount ?? "N/A"}</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileText className="h-5 w-5" /> Recent Applications</h3>
        {property.applications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No applications yet.</p>
        ) : (
          <div className="space-y-2">
            {property.applications.map((app) => (
              <Link key={app.id} href={`/dashboard/applications/${app.id}`} className="flex items-center justify-between py-3 px-4 rounded-md hover:bg-muted/50 border">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{app.applicant.firstName} {app.applicant.lastName}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(app.createdAt)}</p>
                  </div>
                </div>
                {app.decision && (
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${getOutcomeColor(app.decision.outcome)}`}>
                    {humanize(app.decision.outcome)}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
