import { Archive, Fingerprint, ShieldCheck } from "lucide-react";
import { getEvidenceVault } from "@/actions/audit";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDateTime, humanize } from "@/lib/utils";

export const metadata = { title: "Evidence vault" };

export default async function EvidenceVaultPage() {
  const { items, total } = await getEvidenceVault({ pageSize: 100 });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Legal record"
        authority="Chain of custody"
        title="Evidence vault"
        description="Notices, individualized assessments, override justifications, and analyses preserved at the moment they were made — each sealed with a SHA-256 content hash so later alteration is detectable."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Archive, title: `${total} preserved artifacts`, body: "Captured automatically as decisions are made — not reconstructed after a complaint." },
          { icon: Fingerprint, title: "Content-addressed", body: "Re-hash any artifact and compare: a mismatch proves it changed after preservation." },
          { icon: ShieldCheck, title: "Write-once", body: "Updates and deletions are rejected by the data layer for every vault entry." },
        ].map((f) => (
          <div key={f.title} className="flex gap-3 rounded-xl border bg-card p-4">
            <f.icon className="mt-0.5 size-5 shrink-0 text-brass" />
            <div>
              <p className="text-sm font-semibold">{f.title}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Archive} title="The vault is empty" description="Evidence is preserved automatically when notices, assessments, overrides, and analyses are recorded." />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <tr>
                <TH>Artifact</TH>
                <TH className="hidden md:table-cell">Subject</TH>
                <TH>SHA-256</TH>
                <TH className="text-right">Preserved</TH>
              </tr>
            </THead>
            <TBody>
              {items.map((entry) => (
                <TR key={entry.id}>
                  <TD>
                    <p className="text-sm font-medium">{humanize(entry.documentType)}</p>
                    {entry.description && <p className="text-xs text-muted-foreground">{entry.description}</p>}
                  </TD>
                  <TD className="hidden md:table-cell">
                    <Badge>{humanize(entry.entityType)}</Badge>
                  </TD>
                  <TD>
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]" title={entry.contentHash}>
                      {entry.contentHash.slice(0, 12)}…{entry.contentHash.slice(-6)}
                    </code>
                  </TD>
                  <TD className="whitespace-nowrap text-right text-xs text-muted-foreground">{formatDateTime(entry.storedAt)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
