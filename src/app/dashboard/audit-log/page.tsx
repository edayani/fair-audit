import { getAuditLog } from "@/actions/audit";
import { PageHeader } from "@/components/shared/page-header";
import { formatDateTime, humanize } from "@/lib/utils";

export default async function AuditLogPage() {
  const { items, total, page, totalPages } = await getAuditLog();

  return (
    <div>
      <PageHeader title="Audit Log" description="Immutable record of all system actions (Spec §4.K)" />
      <p className="text-sm text-muted-foreground mb-4">{total} total entries</p>
      {items.length === 0 ? (
        <p className="text-muted-foreground">No audit log entries. Actions will be recorded automatically.</p>
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Timestamp</th>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Action</th>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Table</th>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Record</th>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">User</th>
              </tr>
            </thead>
            <tbody>
              {items.map((log) => (
                <tr key={log.id} className="border-b hover:bg-muted/50">
                  <td className="p-4 text-muted-foreground whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                  <td className="p-4"><span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs">{log.action}</span></td>
                  <td className="p-4 font-medium">{humanize(log.tableName)}</td>
                  <td className="p-4 text-muted-foreground font-mono text-xs">{log.recordId.slice(0, 12)}...</td>
                  <td className="p-4 text-muted-foreground">{log.userEmail ?? "System"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
