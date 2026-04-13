import { getPoliciesForProperty } from "@/actions/policy";
import { PageHeader } from "@/components/shared/page-header";
import { PolicyForm } from "@/components/policy/policy-form";
import { formatDate } from "@/lib/utils";
import { CheckCircle, Clock } from "lucide-react";

export default async function PolicyPage({ params }: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = await params;
  const policies = await getPoliciesForProperty(propertyId);
  const activePolicy = policies.find((p) => p.isActive);

  return (
    <div>
      <PageHeader title="Screening Policy" description="Configure screening criteria for this property (Spec §4.A)" />
      {activePolicy && (
        <div className="rounded-lg border bg-green-50 dark:bg-green-900/20 p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-semibold text-green-800 dark:text-green-300">Active Policy: {activePolicy.name} (v{activePolicy.version})</span>
          </div>
          <p className="text-sm text-green-700 dark:text-green-400">Published {formatDate(activePolicy.publishedAt)}</p>
          <div className="mt-3 space-y-1">
            {activePolicy.rules.map((rule) => (
              <div key={rule.id} className="text-sm flex items-center gap-2">
                <span className="font-medium">{rule.label}:</span>
                <span className="text-muted-foreground">{rule.operator} {rule.value}</span>
                {rule.isDisqualifying && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded dark:bg-red-900/30 dark:text-red-400">Disqualifying</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      {policies.length > 1 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-1"><Clock className="h-4 w-4" /> Policy History</h3>
          <div className="space-y-1">
            {policies.filter((p) => !p.isActive).map((p) => (
              <div key={p.id} className="text-sm text-muted-foreground">v{p.version} - {p.name} ({formatDate(p.createdAt)})</div>
            ))}
          </div>
        </div>
      )}
      <PolicyForm propertyId={propertyId} />
    </div>
  );
}
