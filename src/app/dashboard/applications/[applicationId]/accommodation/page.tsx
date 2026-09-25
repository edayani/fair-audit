import { notFound } from "next/navigation";
import { Accessibility } from "lucide-react";
import { getApplication } from "@/actions/application";
import { AccommodationForm, AccommodationResolver } from "@/components/accommodation/accommodation-form";
import { PreviewGate } from "@/components/shared/preview-gate";
import { Card } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Accommodations" };

export default async function AccommodationPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  const app = await getApplication(applicationId);
  if (!app) notFound();

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <div className="space-y-4">
        <div>
          <h2 className="font-semibold">Reasonable accommodation requests</h2>
          <p className="text-sm text-muted-foreground">
            Fair Housing Act, 42 U.S.C. § 3604(f)(3)(B); Section 504 of the Rehabilitation Act for federally assisted housing.
          </p>
        </div>
        {app.accommodations.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed bg-card/50 px-6 py-12 text-center">
            <Accessibility className="mb-3 size-6 text-muted-foreground" />
            <p className="text-sm font-medium">No accommodation requests</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">Requests logged here trigger the interactive process and are tracked to resolution.</p>
          </div>
        ) : (
          app.accommodations.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{a.accommodationType}</span>
                  {a.isDisabilityRelated && (
                    <Badge tone="violet">
                      <Accessibility />
                      Disability-related
                    </Badge>
                  )}
                </div>
                <StatusBadge status={a.status} />
              </div>
              <p className="mt-2 text-sm leading-relaxed">{a.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Requested {formatDate(a.createdAt)}
                {a.grantedAt ? ` · Granted ${formatDate(a.grantedAt)}` : ""}
              </p>
              {a.status === "DENIED" && a.deniedReason && (
                <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
                  <span className="font-medium">Reason for denial: </span>
                  {a.deniedReason}
                </p>
              )}
              {a.status === "PENDING" && (
                <div className="mt-3 flex justify-end">
                  <PreviewGate label="Full access required">
                    <AccommodationResolver accommodationId={a.id} />
                  </PreviewGate>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
      <PreviewGate label="Full access required to log requests">
        <AccommodationForm applicationId={applicationId} />
      </PreviewGate>
    </div>
  );
}
