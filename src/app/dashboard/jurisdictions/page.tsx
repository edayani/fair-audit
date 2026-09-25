import { Globe2, Landmark, MapPin } from "lucide-react";
import { getJurisdictions } from "@/actions/jurisdiction";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardHeaderRow } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, humanize } from "@/lib/utils";

export const metadata = { title: "Jurisdictions" };

const LEVEL = {
  FEDERAL: { icon: Globe2, label: "Federal" },
  STATE: { icon: Landmark, label: "State" },
  LOCAL: { icon: MapPin, label: "Local" },
} as const;

export default async function JurisdictionsPage() {
  const jurisdictions = await getJurisdictions();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Legal record"
        authority="Spec §4.M · rule overlays"
        title="Jurisdictions & rule overlays"
        description="Federal, state, and local fair-housing rules layered onto each property's policy. Where rules overlap, the most protective standard controls."
      />

      {jurisdictions.length === 0 ? (
        <EmptyState icon={Landmark} title="No jurisdictions configured" description="Load the sample portfolio to populate federal and California rule sets." />
      ) : (
        <div className="space-y-6">
          {jurisdictions.map((j) => {
            const level = LEVEL[j.level as keyof typeof LEVEL] ?? LEVEL.LOCAL;
            return (
              <Card key={j.id}>
                <CardHeaderRow
                  icon={level.icon}
                  title={j.name}
                  description={`${j.rules.length} rule${j.rules.length === 1 ? "" : "s"} in force`}
                  actions={
                    <div className="flex gap-1.5">
                      <Badge tone="brand">{level.label}</Badge>
                      <Badge className="font-mono">{j.code}</Badge>
                    </div>
                  }
                />
                <ul className="divide-y">
                  {j.rules.map((rule) => (
                    <li key={rule.id} className="grid gap-1 px-5 py-4 sm:grid-cols-[200px_1fr] sm:gap-6 sm:px-6">
                      <div>
                        <p className="text-sm font-medium">{humanize(rule.category)}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">{rule.ruleKey}</p>
                      </div>
                      <div>
                        <p className="text-sm leading-relaxed">{rule.ruleText}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Effective {formatDate(rule.effectiveDate)}
                          {rule.expirationDate ? ` · expires ${formatDate(rule.expirationDate)}` : ""} · v{rule.version}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
