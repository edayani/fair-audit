import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, FileText, ScrollText, Settings2 } from "lucide-react";
import { getProperty } from "@/actions/property";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeaderRow } from "@/components/ui/card";
import { OutcomeBadge, Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Property" };

export default async function PropertyDetailPage({ params }: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = await params;
  const property = await getProperty(propertyId);
  if (!property) notFound();

  const active = property.screeningPolicies.find((p) => p.isActive);
  const decided = property.applications.filter((a) => a.decision);

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: "/dashboard/properties", label: "Properties" }}
        eyebrow="Property"
        title={property.name}
        description={[property.address, property.city, property.state, property.zipCode].filter(Boolean).join(", ") || "No address on file"}
      >
        <Link href={`/dashboard/properties/${propertyId}/policy`} className={buttonVariants()}>
          <Settings2 />
          Screening policy
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Applications" value={property._count.applications} icon={FileText} />
        <StatCard label="Units" value={property.unitCount ?? "—"} />
        <StatCard label="Policy versions" value={property.screeningPolicies.length} icon={ScrollText} />
        <StatCard label="Decided (recent)" value={`${decided.length}/${property.applications.length}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeaderRow
            title="Recent applications"
            actions={
              <Link href={`/dashboard/applications?property=${propertyId}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                View all
                <ArrowRight />
              </Link>
            }
          />
          {property.applications.length === 0 ? (
            <CardContent className="text-sm text-muted-foreground">No applications yet.</CardContent>
          ) : (
            <ul className="divide-y">
              {property.applications.map((app) => (
                <li key={app.id}>
                  <Link href={`/dashboard/applications/${app.id}`} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-muted/40 sm:px-6">
                    <div>
                      <p className="text-sm font-medium">
                        {app.applicant.firstName} {app.applicant.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(app.submittedAt)}</p>
                    </div>
                    <OutcomeBadge outcome={app.decision?.outcome} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeaderRow title="Governing policy" />
          <CardContent className="space-y-3 text-sm">
            {active ? (
              <>
                <p className="font-medium">{active.name}</p>
                <div className="flex gap-2">
                  <Badge tone="success">Published v{active.version}</Badge>
                  <Badge>{formatDate(active.publishedAt)}</Badge>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Prior versions remain on file so any past determination can be evaluated against the standard in force at the time.
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">
                No policy is published. Applications at this property cannot be evaluated until a written policy is in force.
              </p>
            )}
            <Link href={`/dashboard/properties/${propertyId}/policy`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              {active ? "Review or revise" : "Publish a policy"}
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
