import { getFeatureRegistry } from "@/actions/proxy-risk";
import { PageHeader } from "@/components/shared/page-header";
import { RunProxyDetectionButton } from "@/components/proxy-risk/run-proxy-detection-button";
import { humanize } from "@/lib/utils";
import { AlertTriangle, Shield } from "lucide-react";

export default async function FeaturesPage() {
  const features = await getFeatureRegistry();

  return (
    <div>
      <PageHeader title="Feature Registry" description="Proxy-risk and feature governance (Spec §4.E)">
        <RunProxyDetectionButton />
      </PageHeader>

      {features.length === 0 ? (
        <p className="text-muted-foreground">No features registered. Seed demo data or register features manually.</p>
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Feature</th>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Source</th>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Proxy Risk</th>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Proxy For</th>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f) => (
                <tr key={f.id} className="border-b hover:bg-muted/50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {f.flaggedAsProxy ? <AlertTriangle className="h-4 w-4 text-orange-500" /> : <Shield className="h-4 w-4 text-green-500" />}
                      <div><p className="font-medium">{f.displayName}</p><p className="text-xs text-muted-foreground">{f.name}</p></div>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{f.source}</td>
                  <td className="p-4">
                    {f.proxyRiskScore != null && (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${f.proxyRiskScore > 0.6 ? "bg-red-500" : f.proxyRiskScore > 0.3 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${f.proxyRiskScore * 100}%` }} />
                        </div>
                        <span className="text-xs">{(f.proxyRiskScore * 100).toFixed(0)}%</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-muted-foreground">{f.proxyFor ?? "-"}</td>
                  <td className="p-4"><span className={`text-xs px-2 py-0.5 rounded-full ${f.flaggedAsProxy ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"}`}>{f.flaggedAsProxy ? "Flagged" : "Clear"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
