import Link from "next/link";
import { Building2, CheckCircle2, CircleDashed, FileText, MapPin, Plus } from "lucide-react";
import { getProperties } from "@/actions/property";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Properties" };

export default async function PropertiesPage() {
  const properties = await getProperties();

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Properties"
        description="Each property carries its own published, versioned screening policy — so every determination is measured against a written standard."
      >
        <Link href="/dashboard/properties/new" className={buttonVariants()}>
          <Plus />
          Add property
        </Link>
      </PageHeader>

      {properties.length === 0 ? (
        <EmptyState icon={Building2} title="No properties yet" description="Add your first property, then publish a screening policy for it.">
          <Link href="/dashboard/properties/new" className={buttonVariants()}>
            <Plus />
            Add property
          </Link>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => {
            const policy = property.screeningPolicies[0];
            return (
              <Link
                key={property.id}
                href={`/dashboard/properties/${property.id}`}
                className="group flex flex-col rounded-xl border bg-card p-5 transition-all hover:-translate-y-px hover:border-primary/25 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-ink text-white">
                    <Building2 className="size-5" />
                  </div>
                  {policy ? (
                    <Badge tone="success">
                      <CheckCircle2 />
                      Policy v{policy.version}
                    </Badge>
                  ) : (
                    <Badge tone="warning">
                      <CircleDashed />
                      No published policy
                    </Badge>
                  )}
                </div>
                <h3 className="mt-4 font-serif text-lg font-semibold leading-snug group-hover:text-primary">{property.name}</h3>
                <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" />
                  {[property.address, property.city, property.state].filter(Boolean).join(", ") || "No address on file"}
                </p>
                <div className="mt-auto flex items-center gap-4 border-t pt-4 text-sm text-muted-foreground [margin-top:1.25rem]">
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="size-3.5" />
                    {property._count.applications} applications
                  </span>
                  {property.unitCount != null && <span>{property.unitCount} units</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
