import { getJurisdictions } from "@/actions/jurisdiction";
import { PageHeader } from "@/components/shared/page-header";
import { formatDate, humanize } from "@/lib/utils";
import { Scale, Globe, MapPin } from "lucide-react";

export default async function JurisdictionsPage() {
  const jurisdictions = await getJurisdictions();
  const levelIcon = (level: string) => level === "FEDERAL" ? <Globe className="h-4 w-4" /> : level === "STATE" ? <Scale className="h-4 w-4" /> : <MapPin className="h-4 w-4" />;

  return (
    <div>
      <PageHeader title="Jurisdictions" description="Federal, state, and local rule overlays (Spec §4.M)" />

      {jurisdictions.length === 0 ? (
        <p className="text-muted-foreground">No jurisdictions configured. Seed demo data to populate default federal and California rules.</p>
      ) : (
        <div className="space-y-4">
          {jurisdictions.map((j) => (
            <div key={j.id} className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-2 mb-3">
                {levelIcon(j.level)}
                <h3 className="text-lg font-semibold">{j.name}</h3>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{j.code}</span>
                <span className="text-xs text-muted-foreground">{humanize(j.level)}</span>
              </div>
              {j.rules.length > 0 && (
                <div className="space-y-2">
                  {j.rules.map((rule) => (
                    <div key={rule.id} className="text-sm border-l-2 border-primary/30 pl-3">
                      <p className="font-medium">{rule.ruleKey}</p>
                      <p className="text-muted-foreground">{rule.ruleText}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Category: {rule.category} | Effective: {formatDate(rule.effectiveDate)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
