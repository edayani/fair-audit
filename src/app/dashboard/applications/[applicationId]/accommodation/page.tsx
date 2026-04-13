import { getApplication } from "@/actions/application";
import { PageHeader } from "@/components/shared/page-header";
import { AccommodationForm } from "@/components/accommodation/accommodation-form";
import { formatDate, humanize } from "@/lib/utils";
import { CheckCircle, XCircle, Clock, Accessibility } from "lucide-react";

export default async function AccommodationPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  const app = await getApplication(applicationId);

  const statusIcon = (status: string) => {
    switch (status) {
      case "GRANTED": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "DENIED": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div>
      <PageHeader title="Accommodations" description="Reasonable accommodation requests (ADA / FHA §3604(f))" />

      {app.accommodations.length > 0 && (
        <div className="space-y-3 mb-8">
          {app.accommodations.map((a) => (
            <div key={a.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {statusIcon(a.status)}
                  <span className="font-medium text-sm">{humanize(a.accommodationType)}</span>
                  {a.isDisabilityRelated && (
                    <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full dark:bg-purple-900/30 dark:text-purple-300">
                      <Accessibility className="h-3 w-3" /> Disability-Related
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</span>
              </div>
              <p className="text-sm">{a.description}</p>
              {a.status === "GRANTED" && a.grantedAt && (
                <p className="text-sm text-green-600 mt-2">Granted on {formatDate(a.grantedAt)}</p>
              )}
              {a.status === "DENIED" && a.deniedReason && (
                <p className="text-sm text-red-600 mt-2">Denied: {a.deniedReason}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <AccommodationForm applicationId={applicationId} />
    </div>
  );
}
