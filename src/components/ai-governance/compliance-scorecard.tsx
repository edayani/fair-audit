import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Scores {
  fairnessScore: number;
  transparencyScore: number;
  accountabilityScore: number;
  explainabilityScore: number;
  humanOversightRate: number;
  auditCompleteness: number;
  overallGrade: string;
  riskClassification: string;
}

const METRICS: Array<{ key: keyof Scores; name: string; detail: string }> = [
  { key: "fairnessScore", name: "Fairness", detail: "Mean impact ratio across monitored classes" },
  { key: "transparencyScore", name: "Transparency", detail: "Determinations carrying reason codes" },
  { key: "accountabilityScore", name: "Accountability", detail: "Alerts and proxy flags resolved or reviewed" },
  { key: "explainabilityScore", name: "Individualized review", detail: "Criminal-history cases with an assessment" },
  { key: "humanOversightRate", name: "Human oversight", detail: "Determinations reviewed by a person" },
  { key: "auditCompleteness", name: "Record completeness", detail: "Audit coverage of material actions" },
];

function tone(score: number) {
  return score >= 80 ? "text-emerald-600 dark:text-emerald-400" : score >= 60 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400";
}
function ringColor(score: number) {
  return score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#f43f5e";
}

function Ring({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div
      className="relative size-14 shrink-0 rounded-full"
      style={{ background: `conic-gradient(${ringColor(pct)} ${pct * 3.6}deg, var(--muted) 0deg)` }}
      aria-hidden
    >
      <div className="absolute inset-[5px] flex items-center justify-center rounded-full bg-card text-xs font-semibold tabular">{Math.round(pct)}</div>
    </div>
  );
}

const RISK_TONE: Record<string, "success" | "warning" | "danger"> = { LOW: "success", MEDIUM: "warning", HIGH: "danger", UNACCEPTABLE: "danger" };

export function ComplianceScorecard({ scores }: { scores: Scores }) {
  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-wrap items-center gap-5 border-b px-5 py-5 sm:px-6">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-ink font-serif text-4xl font-semibold text-white">{scores.overallGrade}</div>
        <div>
          <p className="text-sm text-muted-foreground">Overall governance grade</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge tone={RISK_TONE[scores.riskClassification] ?? "neutral"}>Risk: {scores.riskClassification.toLowerCase()}</Badge>
            <span className="text-xs text-muted-foreground">Mapped to NIST AI RMF functions: Govern · Map · Measure · Manage</span>
          </div>
        </div>
      </div>
      <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
        {METRICS.map((m) => {
          const value = scores[m.key] as number;
          return (
            <div key={m.key} className="flex items-center gap-4 bg-card px-5 py-4 sm:px-6">
              <Ring score={value} />
              <div className="min-w-0">
                <p className="text-sm font-medium">{m.name}</p>
                <p className={cn("font-serif text-xl font-semibold tabular", tone(value))}>{value.toFixed(1)}</p>
                <p className="text-xs leading-snug text-muted-foreground">{m.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
