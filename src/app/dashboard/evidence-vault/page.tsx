import { getEvidenceVault } from "@/actions/audit";
import { PageHeader } from "@/components/shared/page-header";
import { formatDateTime, humanize } from "@/lib/utils";
import { Archive, FileText } from "lucide-react";

export default async function EvidenceVaultPage() {
  const { items, total } = await getEvidenceVault();

  return (
    <div>
      <PageHeader title="Evidence Vault" description="Immutable document and evidence storage (Spec §4.K)" />
      <p className="text-sm text-muted-foreground mb-4">{total} entries</p>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Archive className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Evidence vault is empty. Documents will be stored here as decisions and challenges are processed.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{humanize(entry.documentType)}</p>
                  <p className="text-xs text-muted-foreground">{humanize(entry.entityType)} — {entry.entityId.slice(0, 12)}...</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{formatDateTime(entry.storedAt)}</p>
                <p className="text-xs font-mono text-muted-foreground">Hash: {entry.contentHash.slice(0, 16)}...</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
