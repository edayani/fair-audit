import Link from "next/link";
import { ChevronLeft, ChevronRight, Lock, ScrollText } from "lucide-react";
import { getAuditLog } from "@/actions/audit";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/form";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { cn, formatDateTime, humanize } from "@/lib/utils";
import { auditActionTone, describeAuditAction } from "@/lib/audit-labels";

export const metadata = { title: "Audit trail" };

const TABLES = [
  "Decision",
  "HumanReview",
  "Override",
  "IndividualizedAssessment",
  "Challenge",
  "Accommodation",
  "Notice",
  "ScreeningPolicy",
  "ScreeningRecord",
  "DisparityReport",
  "BurdenShiftingAnalysis",
  "DriftAlert",
  "Organization",
];

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<{ page?: string; table?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const table = sp.table && TABLES.includes(sp.table) ? sp.table : undefined;
  const { items, total, totalPages } = await getAuditLog({ page, pageSize: 25, tableName: table });

  const href = (p: number) => `/dashboard/audit-log?${new URLSearchParams({ ...(table ? { table } : {}), page: String(p) })}`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Legal record"
        authority="Spec §4.K · append-only"
        title="Audit trail"
        description="A contemporaneous, attributed, and immutable record of every material action — the administrative record you produce when a determination is questioned."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="size-4" />
          {total.toLocaleString()} entries · updates and deletions are blocked at the data layer
        </p>
        <form method="get" className="flex gap-2">
          <Select name="table" defaultValue={table ?? ""} className="w-56" aria-label="Filter by record type">
            <option value="">All record types</option>
            {TABLES.map((t) => (
              <option key={t} value={t}>
                {humanize(t)}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </form>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={ScrollText} title="No entries" description="Actions are recorded automatically as your team works." />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <tr>
                <TH>When</TH>
                <TH>Action</TH>
                <TH className="hidden md:table-cell">Record</TH>
                <TH className="hidden sm:table-cell">Actor</TH>
              </tr>
            </THead>
            <TBody>
              {items.map((log) => {
                const meta = log.metadata as { applicationId?: string } | null;
                return (
                  <TR key={log.id}>
                    <TD className="whitespace-nowrap text-xs text-muted-foreground tabular">{formatDateTime(log.timestamp)}</TD>
                    <TD>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm">{describeAuditAction(log.action, log.tableName)}</span>
                        <Badge tone={auditActionTone(log.action)} className="w-fit font-mono text-[10px]">
                          {log.action}
                        </Badge>
                      </div>
                    </TD>
                    <TD className="hidden md:table-cell">
                      <p className="text-sm">{humanize(log.tableName)}</p>
                      {meta?.applicationId ? (
                        <Link href={`/dashboard/applications/${meta.applicationId}`} className="font-mono text-[11px] text-primary hover:underline">
                          {log.recordId.slice(0, 14)}…
                        </Link>
                      ) : (
                        <span className="font-mono text-[11px] text-muted-foreground">{log.recordId.slice(0, 14)}…</span>
                      )}
                    </TD>
                    <TD className="hidden text-sm text-muted-foreground sm:table-cell">{log.userEmail ?? "System"}</TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-5 py-3 sm:px-6">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Link
                  href={href(page - 1)}
                  aria-disabled={page <= 1}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), page <= 1 && "pointer-events-none opacity-50")}
                >
                  <ChevronLeft />
                  Newer
                </Link>
                <Link
                  href={href(page + 1)}
                  aria-disabled={page >= totalPages}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), page >= totalPages && "pointer-events-none opacity-50")}
                >
                  Older
                  <ChevronRight />
                </Link>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
