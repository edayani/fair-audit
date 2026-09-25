import { notFound } from "next/navigation";
import { CheckCircle2, History } from "lucide-react";
import { getPoliciesForProperty } from "@/actions/policy";
import { getProperty } from "@/actions/property";
import { PageHeader } from "@/components/shared/page-header";
import { PolicyForm } from "@/components/policy/policy-form";
import { PreviewGate } from "@/components/shared/preview-gate";
import { Card, CardContent, CardHeaderRow } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDate, humanize } from "@/lib/utils";
import { OPERATORS } from "@/lib/constants/screening-criteria";

export const metadata = { title: "Screening policy" };

const opLabel = (op: string) => OPERATORS.find((o) => o.value === op)?.label.toLowerCase() ?? op;

export default async function PolicyPage({ params }: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = await params;
  const [property, policies] = await Promise.all([getProperty(propertyId), getPoliciesForProperty(propertyId)]);
  if (!property) notFound();
  const active = policies.find((p) => p.isActive);
  const history = policies.filter((p) => !p.isActive);

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: `/dashboard/properties/${propertyId}`, label: property.name }}
        eyebrow="Screening policy"
        authority="Spec §4.A · written, versioned criteria"
        title="Screening policy"
        description="A written, published standard applied uniformly to every applicant. Each criterion must serve a substantial, legitimate, nondiscriminatory interest."
      />

      {active ? (
        <Card>
          <CardHeaderRow
            icon={CheckCircle2}
            title={`${active.name} · v${active.version}`}
            description={`Published ${formatDate(active.publishedAt)} — governs all new determinations at this property`}
            actions={<Badge tone="success">In force</Badge>}
          />
          <Table>
            <THead>
              <tr>
                <TH>Criterion</TH>
                <TH>Standard</TH>
                <TH className="hidden md:table-cell">Lookback</TH>
                <TH className="hidden sm:table-cell">Weight</TH>
                <TH>Effect</TH>
              </tr>
            </THead>
            <TBody>
              {active.rules.map((rule) => (
                <TR key={rule.id}>
                  <TD>
                    <p className="font-medium">{rule.label}</p>
                    <p className="text-xs text-muted-foreground">{humanize(rule.criterionType)}</p>
                  </TD>
                  <TD className="text-muted-foreground">
                    {opLabel(rule.operator)} <span className="font-medium text-foreground">{rule.value}</span>
                  </TD>
                  <TD className="hidden text-muted-foreground md:table-cell">{rule.lookbackMonths ? `${rule.lookbackMonths} mo` : "—"}</TD>
                  <TD className="hidden tabular sm:table-cell">{rule.weight.toFixed(1)}×</TD>
                  <TD>
                    <div className="flex flex-wrap gap-1">
                      {rule.isDisqualifying ? <Badge tone="danger">Disqualifying</Badge> : <Badge>Weighted</Badge>}
                      {rule.mitigationAllowed && <Badge tone="info">Mitigable</Badge>}
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      ) : (
        <div className="rounded-xl border border-amber-300 bg-amber-50/70 px-5 py-4 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-200">
          No policy is in force. Publish a version below before evaluating applications at this property.
        </div>
      )}

      {history.length > 0 && (
        <Card>
          <CardHeaderRow icon={History} title="Version history" description="Superseded versions are retained for retrospective review." />
          <CardContent className="space-y-2">
            {history.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span>
                  v{p.version} · {p.name}
                </span>
                <span className="text-xs text-muted-foreground">{p.publishedAt ? `Published ${formatDate(p.publishedAt)}` : `Draft ${formatDate(p.createdAt)}`}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <PreviewGate label="Full access required to publish policies">
        <PolicyForm propertyId={propertyId} />
      </PreviewGate>
    </div>
  );
}
