"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Scale } from "lucide-react";
import { submitBurdenShiftingAnalysis } from "@/actions/fairness";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { cn, humanize } from "@/lib/utils";

interface BurdenShiftingAnalysis {
  id: string;
  isFaciallyNeutral: boolean | null;
  facialNeutralityNotes: string | null;
  lessDiscriminatoryAltExists: boolean | null;
  lessDiscriminatoryAltNotes: string | null;
  hasLegitimateObjective: boolean | null;
  legitimateObjectiveNotes: string | null;
  conclusion: string | null;
  analystNotes: string | null;
  analyzedBy?: string;
}

interface Props {
  disparityReportId: string;
  protectedClass: string;
  impactRatio: number;
  existing?: BurdenShiftingAnalysis | null;
  canEdit: boolean;
}

const CONCLUSIONS: Record<string, { label: string; tone: "success" | "danger" | "warning" }> = {
  JUSTIFIED: { label: "Practice justified — no less discriminatory alternative", tone: "success" },
  UNJUSTIFIED: { label: "Unjustified — revise the policy", tone: "danger" },
  NEEDS_FURTHER_REVIEW: { label: "Needs further review", tone: "warning" },
};

function YesNo({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-1.5" role="radiogroup">
      {[true, false].map((v) => (
        <button
          key={String(v)}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={cn(
            "rounded-lg border px-3 py-1 text-xs font-medium transition-colors",
            value === v ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent"
          )}
        >
          {v ? "Yes" : "No"}
        </button>
      ))}
    </div>
  );
}

export function BurdenShiftingPanel({ disparityReportId, protectedClass, impactRatio, existing, canEdit }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    isFaciallyNeutral: existing?.isFaciallyNeutral ?? null,
    facialNeutralityNotes: existing?.facialNeutralityNotes ?? "",
    hasLegitimateObjective: existing?.hasLegitimateObjective ?? null,
    legitimateObjectiveNotes: existing?.legitimateObjectiveNotes ?? "",
    lessDiscriminatoryAltExists: existing?.lessDiscriminatoryAltExists ?? null,
    lessDiscriminatoryAltNotes: existing?.lessDiscriminatoryAltNotes ?? "",
    conclusion: existing?.conclusion ?? "",
    analystNotes: existing?.analystNotes ?? "",
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.conclusion) {
      toast.error("Select a conclusion for the analysis.");
      return;
    }
    startTransition(async () => {
      const result = await submitBurdenShiftingAnalysis(disparityReportId, {
        protectedClass,
        impactRatio,
        isFaciallyNeutral: form.isFaciallyNeutral ?? undefined,
        facialNeutralityNotes: form.facialNeutralityNotes || undefined,
        hasLegitimateObjective: form.hasLegitimateObjective ?? undefined,
        legitimateObjectiveNotes: form.legitimateObjectiveNotes || undefined,
        lessDiscriminatoryAltExists: form.lessDiscriminatoryAltExists ?? undefined,
        lessDiscriminatoryAltNotes: form.lessDiscriminatoryAltNotes || undefined,
        conclusion: form.conclusion,
        analystNotes: form.analystNotes || undefined,
      });
      if (result.success) {
        toast.success("Burden-shifting analysis recorded");
        setEditing(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to save analysis");
      }
    });
  }

  const header = (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="flex items-start gap-2">
        <Scale className="mt-0.5 size-4 text-brass" />
        <div>
          <p className="text-sm font-semibold">Burden-shifting analysis · {humanize(protectedClass)}</p>
          <p className="text-[11px] italic text-muted-foreground">
            24 C.F.R. § 100.500(c); Tex. Dep&apos;t of Hous. &amp; Cmty. Affs. v. Inclusive Cmtys. Project, Inc., 576 U.S. 519 (2015)
          </p>
        </div>
      </div>
      {existing && !editing && canEdit && (
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          <Pencil />
          Supplement
        </Button>
      )}
    </div>
  );

  if (existing && !editing) {
    const c = existing.conclusion ? CONCLUSIONS[existing.conclusion] : null;
    return (
      <div className="mt-4 space-y-3 rounded-lg border bg-muted/30 p-4">
        {header}
        {c && <Badge tone={c.tone}>{c.label}</Badge>}
        <dl className="space-y-2 text-sm">
          {[
            { k: "Step 1 · Discriminatory effect of a facially neutral practice", yes: existing.isFaciallyNeutral, note: existing.facialNeutralityNotes },
            { k: "Step 2 · Substantial, legitimate, nondiscriminatory interest", yes: existing.hasLegitimateObjective, note: existing.legitimateObjectiveNotes },
            { k: "Step 3 · Less discriminatory alternative available", yes: existing.lessDiscriminatoryAltExists, note: existing.lessDiscriminatoryAltNotes },
          ].map((row) => (
            <div key={row.k}>
              <dt className="text-xs font-medium text-muted-foreground">
                {row.k}: <span className="text-foreground">{row.yes == null ? "—" : row.yes ? "Yes" : "No"}</span>
              </dt>
              {row.note && <dd className="mt-0.5 leading-relaxed">{row.note}</dd>}
            </div>
          ))}
        </dl>
        {existing.analyzedBy && <p className="text-xs text-muted-foreground">Analyst: {existing.analyzedBy}</p>}
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="mt-4 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        {header}
        <p className="mt-2">A documented burden-shifting analysis is required. Full access is needed to record one.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-lg border border-amber-300 bg-card p-4 dark:border-amber-700/60">
      {header}
      <Field label="Step 1 — Is the challenged practice facially neutral, and does it cause the disparity (robust causality)?">
        <YesNo value={form.isFaciallyNeutral} onChange={(v) => set("isFaciallyNeutral", v)} />
        <Textarea rows={2} value={form.facialNeutralityNotes} onChange={(e) => set("facialNeutralityNotes", e.target.value)} placeholder="Identify the specific criterion and how it produces the observed disparity…" />
      </Field>
      <Field label="Step 2 — Is the practice necessary to achieve a substantial, legitimate, nondiscriminatory interest?">
        <YesNo value={form.hasLegitimateObjective} onChange={(v) => set("hasLegitimateObjective", v)} />
        <Textarea rows={2} value={form.legitimateObjectiveNotes} onChange={(e) => set("legitimateObjectiveNotes", e.target.value)} placeholder="State the interest and the evidence (not speculation) that the criterion serves it…" />
      </Field>
      <Field label="Step 3 — Could that interest be served by a practice with a less discriminatory effect?">
        <YesNo value={form.lessDiscriminatoryAltExists} onChange={(v) => set("lessDiscriminatoryAltExists", v)} />
        <Textarea rows={2} value={form.lessDiscriminatoryAltNotes} onChange={(e) => set("lessDiscriminatoryAltNotes", e.target.value)} placeholder="e.g., shorter lookback, individualized review, alternative evidence of ability to pay…" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Conclusion" required>
          <Select value={form.conclusion} onChange={(e) => set("conclusion", e.target.value)}>
            <option value="">Select…</option>
            <option value="JUSTIFIED">Justified</option>
            <option value="UNJUSTIFIED">Unjustified — revise policy</option>
            <option value="NEEDS_FURTHER_REVIEW">Needs further review</option>
          </Select>
        </Field>
        <Field label="Analyst notes">
          <Textarea rows={1} value={form.analystNotes} onChange={(e) => set("analystNotes", e.target.value)} />
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        {existing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(false)} disabled={isPending}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" loading={isPending}>
          Record analysis
        </Button>
      </div>
    </form>
  );
}
