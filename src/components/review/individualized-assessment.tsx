"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Scale } from "lucide-react";
import { submitIndividualizedAssessment } from "@/actions/assessment";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AssessmentData {
  id?: string;
  natureAndSeriousness?: string | null;
  natureSeverity?: number | null;
  timeElapsed?: string | null;
  timeElapsedMonths?: number | null;
  rehabilitation?: string | null;
  rehabilitationScore?: number | null;
  mitigatingCircumstances?: string | null;
  mitigatingScore?: number | null;
  tenancyNexus?: string | null;
  overallAssessment?: string | null;
  recommendedOutcome?: string | null;
  assessedBy?: string | null;
  assessedAt?: Date | string | null;
}

interface Props {
  decisionId: string;
  existing?: AssessmentData | null;
  /** Viewers without full access see the record but cannot edit it */
  canEdit?: boolean;
}

const SCALES = {
  severity: ["Minimal", "Minor", "Moderate", "Serious", "Severe"],
  rehabilitation: ["None", "Minimal", "Some", "Significant", "Exceptional"],
  mitigation: ["None", "Minimal", "Some", "Significant", "Compelling"],
};

const OUTCOME_LABELS: Record<string, string> = { APPROVE: "Approve", DENY: "Deny", CONDITIONAL: "Conditional approval" };

function ScalePicker({ value, onChange, labels, name }: { value: number; onChange: (v: number) => void; labels: string[]; name: string }) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-1.5">
      {labels.map((label, idx) => {
        const score = idx + 1;
        const active = value === score;
        return (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(score)}
            className={cn(
              "rounded-lg border px-2.5 py-1 text-xs transition-colors",
              active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent"
            )}
          >
            {score} · {label}
          </button>
        );
      })}
    </div>
  );
}

function ScoreDots({ score }: { score?: number | null }) {
  const s = score ?? 0;
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${s} of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={cn("size-2 rounded-full", i < s ? "bg-brass" : "bg-muted")} />
      ))}
    </span>
  );
}

export function IndividualizedAssessment({ decisionId, existing, canEdit = true }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(!existing && canEdit);

  const [form, setForm] = useState({
    natureAndSeriousness: existing?.natureAndSeriousness ?? "",
    natureSeverity: existing?.natureSeverity ?? 0,
    timeElapsed: existing?.timeElapsed ?? "",
    timeElapsedMonths: existing?.timeElapsedMonths ?? 0,
    rehabilitation: existing?.rehabilitation ?? "",
    rehabilitationScore: existing?.rehabilitationScore ?? 0,
    mitigatingCircumstances: existing?.mitigatingCircumstances ?? "",
    mitigatingScore: existing?.mitigatingScore ?? 0,
    tenancyNexus: existing?.tenancyNexus ?? "",
    overallAssessment: existing?.overallAssessment ?? "",
    recommendedOutcome: existing?.recommendedOutcome ?? "APPROVE",
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const required = [form.natureAndSeriousness, form.timeElapsed, form.rehabilitation, form.tenancyNexus, form.overallAssessment];
    if (required.some((v) => !v.trim())) {
      toast.error("Complete each factor and the overall assessment.");
      return;
    }
    if (form.natureSeverity < 1 || form.rehabilitationScore < 1 || form.mitigatingScore < 1) {
      toast.error("Select a rating for each scored factor.");
      return;
    }
    startTransition(async () => {
      const result = await submitIndividualizedAssessment(decisionId, form);
      if (result.success) {
        toast.success("Individualized assessment recorded and preserved to the evidence vault");
        setEditing(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to save assessment");
      }
    });
  }

  const header = (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4 sm:px-6">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
          <Scale className="size-4" />
        </div>
        <div>
          <h3 className="text-[15px] font-semibold">Individualized assessment of criminal history</h3>
          <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            HUD Office of General Counsel Guidance on Application of Fair Housing Act Standards to the Use of Criminal Records
            (Apr. 4, 2016). Blanket bans are presumptively unjustified; arrests alone are never a basis for denial.
          </p>
        </div>
      </div>
      {existing && !editing && (
        <div className="flex items-center gap-2">
          <Badge tone="success">Completed</Badge>
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil />
              Revise
            </Button>
          )}
        </div>
      )}
    </div>
  );

  if (!editing) {
    if (!existing) {
      return (
        <div className="rounded-xl border border-amber-300 bg-card dark:border-amber-700/60">
          {header}
          <p className="px-5 py-4 text-sm text-muted-foreground sm:px-6">
            An assessment is required before a final determination can be issued. Full access is required to complete it.
          </p>
        </div>
      );
    }
    const rows = [
      { label: "Nature and seriousness of the offense", text: existing.natureAndSeriousness, score: existing.natureSeverity },
      { label: `Time elapsed${existing.timeElapsedMonths ? ` (${existing.timeElapsedMonths} months)` : ""}`, text: existing.timeElapsed },
      { label: "Evidence of rehabilitation", text: existing.rehabilitation, score: existing.rehabilitationScore },
      { label: "Mitigating circumstances", text: existing.mitigatingCircumstances, score: existing.mitigatingScore },
      { label: "Nexus to tenancy", text: existing.tenancyNexus },
      { label: "Overall assessment", text: existing.overallAssessment },
    ];
    return (
      <div className="rounded-xl border bg-card">
        {header}
        <dl className="divide-y">
          {rows.map((r) => (
            <div key={r.label} className="grid gap-1 px-5 py-3.5 sm:grid-cols-[220px_1fr] sm:gap-4 sm:px-6">
              <dt className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground sm:block">
                {r.label}
                {r.score != null && (
                  <span className="sm:mt-1.5 sm:block">
                    <ScoreDots score={r.score} />
                  </span>
                )}
              </dt>
              <dd className="whitespace-pre-wrap text-sm leading-relaxed">{r.text || "—"}</dd>
            </div>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 sm:px-6">
            <span className="text-sm">
              Recommended outcome: <strong>{OUTCOME_LABELS[existing.recommendedOutcome ?? ""] ?? "—"}</strong>
            </span>
            {existing.assessedBy && <span className="text-xs text-muted-foreground">Assessed by {existing.assessedBy}</span>}
          </div>
        </dl>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-amber-300 bg-card dark:border-amber-700/60">
      {header}
      <div className="space-y-6 px-5 py-5 sm:px-6">
        <Field label="Factor 1 — Nature and seriousness of the offense" required>
          <Textarea value={form.natureAndSeriousness} onChange={(e) => set("natureAndSeriousness", e.target.value)} rows={3} placeholder="Describe the conduct, the disposition, and whether it involved harm to persons or property…" />
          <ScalePicker name="Severity" value={form.natureSeverity} onChange={(v) => set("natureSeverity", v)} labels={SCALES.severity} />
        </Field>

        <Field label="Factor 2 — Time elapsed since the offense" required>
          <Textarea value={form.timeElapsed} onChange={(e) => set("timeElapsed", e.target.value)} rows={2} placeholder="Time since the conduct and since completion of any sentence…" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Months since offense</span>
            <Input type="number" min={0} className="h-8 w-24" value={form.timeElapsedMonths} onChange={(e) => set("timeElapsedMonths", parseInt(e.target.value) || 0)} />
          </div>
        </Field>

        <Field label="Factor 3 — Evidence of rehabilitation or good conduct" required>
          <Textarea value={form.rehabilitation} onChange={(e) => set("rehabilitation", e.target.value)} rows={3} placeholder="Employment, program completion, references, tenancy history since the offense…" />
          <ScalePicker name="Rehabilitation" value={form.rehabilitationScore} onChange={(v) => set("rehabilitationScore", v)} labels={SCALES.rehabilitation} />
        </Field>

        <Field label="Factor 4 — Mitigating circumstances">
          <Textarea value={form.mitigatingCircumstances} onChange={(e) => set("mitigatingCircumstances", e.target.value)} rows={2} placeholder="Age at the time of the offense, surrounding circumstances, supportive services…" />
          <ScalePicker name="Mitigation" value={form.mitigatingScore} onChange={(v) => set("mitigatingScore", v)} labels={SCALES.mitigation} />
        </Field>

        <Field label="Nexus to tenancy" hint="Does the record demonstrably relate to resident safety or property? If not, it should not support a denial." required>
          <Textarea value={form.tenancyNexus} onChange={(e) => set("tenancyNexus", e.target.value)} rows={2} />
        </Field>

        <Field label="Overall assessment" required>
          <Textarea value={form.overallAssessment} onChange={(e) => set("overallAssessment", e.target.value)} rows={3} placeholder="Weigh all factors and state the reasoning supporting your recommendation…" />
        </Field>

        <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-end sm:justify-between">
          <Field label="Recommended outcome" className="sm:w-56">
            <Select value={form.recommendedOutcome} onChange={(e) => set("recommendedOutcome", e.target.value)}>
              <option value="APPROVE">Approve</option>
              <option value="CONDITIONAL">Conditional approval</option>
              <option value="DENY">Deny</option>
            </Select>
          </Field>
          <div className="flex gap-2">
            {existing && (
              <Button variant="outline" onClick={() => setEditing(false)} disabled={isPending}>
                Cancel
              </Button>
            )}
            <Button type="submit" loading={isPending}>
              {existing ? "Save revision" : "Record assessment"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
