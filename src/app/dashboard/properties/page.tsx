import { getProperties } from "@/actions/property";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import Link from "next/link";
import { Building2, Plus, FileText } from "lucide-react";

export default async function PropertiesPage() {
  const properties = await getProperties();

  return (
    <div>
      <PageHeader title="Properties" description="Manage properties and their screening policies">
        <Link href="/dashboard/properties/new" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Property
        </Link>
      </PageHeader>

      {properties.length === 0 ? (
        <EmptyState title="No properties yet" description="Add your first property to start configuring screening policies.">
          <Link href="/dashboard/properties/new" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Add Property
          </Link>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property) => (
            <Link key={property.id} href={`/dashboard/properties/${property.id}`} className="rounded-lg border bg-card p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <Building2 className="h-8 w-8 text-primary" />
                {property.screeningPolicies.length > 0 && (
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Policy Active
                  </span>
                )}
              </div>
              <h3 className="font-semibold mb-1">{property.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {[property.address, property.city, property.state].filter(Boolean).join(", ") || "No address"}
              </p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                <span>{property._count.applications} applications</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
