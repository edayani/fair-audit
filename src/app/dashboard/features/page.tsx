import { AlertTriangle, Layers, ShieldCheck } from "lucide-react";
import { getFeatureRegistry } from "@/actions/proxy-risk";
import { PageHeader } from "@/components/shared/page-header";
import { RunProxyDetectionButton } from "@/components/proxy-risk/run-proxy-detection-button";
import { PreviewGate } from "@/components/shared/preview-gate";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard, Meter } from "@/components/shared/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { humanize } from "@/lib/utils";

export const metadata = { title: "Feature governance" };

export default async function FeaturesPage() {
  const features = await getFeatureRegistry();
  const flagged = features.filter((f) => f.flaggedAsProxy);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Adjudication"
        authority="Spec §4.E · proxy discrimination"
        title="Feature governance"
        description="Every data point a screening model can consider, scored for its risk of acting as a proxy for a protected characteristic — so facially neutral inputs don't reproduce prohibited distinctions."
      >
        <PreviewGate label="Full access required">
          <RunProxyDetectionButton />
        </PreviewGate>
      </PageHeader>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Registered features" value={features.length} icon={Layers} />
        <StatCard label="Flagged as proxies" value={flagged.length} icon={AlertTriangle} tone={flagged.length ? "danger" : "success"} />
        <StatCard
          label="Legal review complete"
          value={features.filter((f) => f.legalReviewStatus && f.legalReviewStatus !== "pending").length}
          icon={ShieldCheck}
        />
      </div>

      {features.length === 0 ? (
        <EmptyState icon={Layers} title="No features registered" description="Load the sample portfolio or register the inputs your screening vendors provide." />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <tr>
                <TH>Feature</TH>
                <TH className="hidden md:table-cell">Source</TH>
                <TH>Proxy risk</TH>
                <TH className="hidden lg:table-cell">Potential proxy for</TH>
                <TH>Status</TH>
              </tr>
            </THead>
            <TBody>
              {features.map((f) => {
                const score = f.proxyRiskScore ?? 0;
                const tone = score > 0.6 ? "danger" : score > 0.3 ? "warning" : "success";
                return (
                  <TR key={f.id} className="align-top">
                    <TD className="max-w-xs">
                      <p className="font-medium">{f.displayName}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{f.name}</p>
                      {f.proxyExplanation && f.flaggedAsProxy && <p className="mt-1 text-xs leading-snug text-muted-foreground">{f.proxyExplanation.split("\n")[0]}</p>}
                    </TD>
                    <TD className="hidden capitalize text-muted-foreground md:table-cell">{f.source}</TD>
                    <TD className="w-40">
                      {f.proxyRiskScore != null ? (
                        <div className="flex items-center gap-2">
                          <Meter value={score} tone={tone} className="w-20" label={`Proxy risk ${Math.round(score * 100)}%`} />
                          <span className="text-xs tabular">{Math.round(score * 100)}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not scored</span>
                      )}
                    </TD>
                    <TD className="hidden text-muted-foreground lg:table-cell">{f.proxyFor ? humanize(f.proxyFor) : "—"}</TD>
                    <TD>
                      <div className="flex flex-col items-start gap-1">
                        {f.flaggedAsProxy ? <Badge tone="danger">Flagged</Badge> : <Badge tone="success">Clear</Badge>}
                        {f.legalReviewStatus && <Badge tone={f.legalReviewStatus === "approved" ? "success" : f.legalReviewStatus === "rejected" ? "danger" : "neutral"}>Counsel: {f.legalReviewStatus}</Badge>}
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
