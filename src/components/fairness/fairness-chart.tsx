// Spec §4.F — Approval rates by group against the four-fifths benchmark.
// Pure CSS (no chart library) so it renders on the server and in both themes.
import { cn, formatPercent } from "@/lib/utils";

interface GroupMetric {
  groupName: string;
  total: number;
  approved: number;
  approvalRate: number;
}

export function FairnessChart({ groups }: { groups: GroupMetric[] }) {
  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground">Insufficient sample: each group needs at least five decided applications.</p>;
  }
  const max = Math.max(...groups.map((g) => g.approvalRate), 0.0001);
  const threshold = max * 0.8;
  const sorted = [...groups].sort((a, b) => b.approvalRate - a.approvalRate);

  return (
    <div className="space-y-2.5">
      {sorted.map((g) => {
        const below = g.approvalRate < threshold;
        return (
          <div key={g.groupName}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
              <span className="truncate font-medium">{g.groupName}</span>
              <span className={cn("tabular", below ? "font-semibold text-rose-600 dark:text-rose-400" : "text-muted-foreground")}>
                {formatPercent(g.approvalRate, 0)} <span className="text-muted-foreground">· n={g.total}</span>
              </span>
            </div>
            <div className="relative h-2.5 rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", below ? "bg-rose-500" : "bg-primary")}
                style={{ width: `${Math.max(2, g.approvalRate * 100)}%` }}
              />
              <div
                className="absolute -top-1 h-[18px] w-px bg-foreground/50"
                style={{ left: `${threshold * 100}%` }}
                title={`Four-fifths benchmark: ${formatPercent(threshold, 0)}`}
              />
            </div>
          </div>
        );
      })}
      <p className="pt-1 text-[11px] text-muted-foreground">
        Vertical rule marks 80% of the highest group&apos;s approval rate ({formatPercent(threshold, 0)}).
      </p>
    </div>
  );
}
