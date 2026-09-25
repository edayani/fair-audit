"use client";
// Spec §4.A — Policy Configuration Engine
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Plus, Sparkles, Trash2 } from "lucide-react";
import { createPolicy, parseNaturalLanguagePolicy, publishPolicy } from "@/actions/policy";
import { CRITERION_TYPES, DEFAULT_LOOKBACK_MONTHS, OPERATORS } from "@/lib/constants/screening-criteria";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form";

type CriterionType = (typeof CRITERION_TYPES)[number]["value"];

interface PolicyRule {
  criterionType: CriterionType;
  label: string;
  operator: string;
  value: string;
  weight: number;
  isDisqualifying: boolean;
  lookbackMonths: number | null;
  mitigationAllowed: boolean;
  waiverConditions: string | null;
}

const emptyRule: PolicyRule = {
  criterionType: "CREDIT_SCORE",
  label: "",
  operator: "GTE",
  value: "",
  weight: 1.0,
  isDisqualifying: false,
  lookbackMonths: null,
  mitigationAllowed: true,
  waiverConditions: null,
};

/** Inline legal guardrails surfaced while drafting a criterion */
const GUARDRAILS: Partial<Record<CriterionType, string>> = {
  SOURCE_OF_INCOME:
    "Screening on source of income (including housing vouchers) is prohibited in California (Gov. Code § 12955) and many other states and localities. Use income sufficiency net of the voucher instead.",
  CRIMINAL_HISTORY:
    "Arrests without conviction may not be used. Blanket exclusions are presumptively unjustified under HUD guidance — scope the lookback and require an individualized assessment.",
  CREDIT_SCORE:
    "For voucher holders and applicants with thin credit files, credit thresholds can produce disparate impact. Consider alternative evidence of ability to pay.",
  INCOME_REQUIREMENT:
    "For voucher holders, apply the income ratio only to the tenant's portion of rent to avoid source-of-income discrimination.",
};

export function PolicyForm({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [rules, setRules] = useState<PolicyRule[]>([{ ...emptyRule }]);
  const [nlText, setNlText] = useState("");
  const [showNlParser, setShowNlParser] = useState(false);

  const addRule = () => setRules((prev) => [...prev, { ...emptyRule }]);
  const removeRule = (index: number) => setRules((prev) => prev.filter((_, i) => i !== index));
  function updateRule<K extends keyof PolicyRule>(index: number, field: K, value: PolicyRule[K]) {
    setRules((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createPolicy({
        propertyId,
        name,
        rules: rules.map((r, i) => ({ ...r, sortOrder: i, lookbackMonths: r.lookbackMonths && r.lookbackMonths > 0 ? r.lookbackMonths : null })),
      });
      if (!result.success) {
        toast.error(result.error ?? "Failed to create policy");
        return;
      }
      const pub = await publishPolicy(result.data!.id);
      if (pub.success) {
        toast.success("Policy published — it now governs new determinations");
        setName("");
        setRules([{ ...emptyRule }]);
        router.refresh();
      } else {
        toast.error(pub.error ?? "Policy saved as draft but could not be published");
      }
    });
  }

  function handleNlParse() {
    // §4.A — LLM use case 1: natural-language policy parser, human approval required
    startTransition(async () => {
      const result = await parseNaturalLanguagePolicy(nlText);
      if (result.success && result.data && result.data.length > 0) {
        setRules(
          result.data.map((r) => ({
            criterionType: (CRITERION_TYPES.some((c) => c.value === r.criterionType) ? r.criterionType : "CUSTOM") as CriterionType,
            label: r.label || "",
            operator: r.operator || "GTE",
            value: r.value || "",
            weight: 1.0,
            isDisqualifying: r.isDisqualifying || false,
            lookbackMonths: r.lookbackMonths,
            mitigationAllowed: r.mitigationAllowed ?? true,
            waiverConditions: r.waiverConditions,
          }))
        );
        toast.success("Draft rules created — review each one before publishing");
        setShowNlParser(false);
      } else if (result.success) {
        toast.info("No structured rules were found. AI parsing may be unavailable; add rules manually.");
      } else {
        toast.error(result.error ?? "Failed to parse policy");
      }
    });
  }

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4 sm:px-6">
        <div>
          <h3 className="text-[15px] font-semibold">Draft a new policy version</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">Publishing supersedes the current version prospectively; prior versions remain on file.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowNlParser((v) => !v)}>
          <Sparkles className="text-brass" />
          Draft from plain language
        </Button>
      </div>

      {showNlParser && (
        <div className="border-b bg-muted/40 px-5 py-4 sm:px-6">
          <Field
            label="Describe the policy in plain language"
            hint="AI converts the text into draft criteria. Nothing takes effect until a person reviews and publishes it."
          >
            <Textarea
              value={nlText}
              onChange={(e) => setNlText(e.target.value)}
              rows={3}
              placeholder="e.g., No eviction judgments in the last 3 years. Income must be at least 2x the tenant's share of rent. Criminal history reviewed individually, 5-year lookback for felonies."
            />
          </Field>
          <Button className="mt-3" size="sm" onClick={handleNlParse} loading={isPending} disabled={!nlText.trim()}>
            Generate draft rules
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5 sm:px-6">
        <Field label="Policy name" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g., Low-Barrier Screening Standard 2026" />
        </Field>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Criteria</h4>
            <Button variant="ghost" size="sm" onClick={addRule}>
              <Plus />
              Add criterion
            </Button>
          </div>

          {rules.map((rule, index) => {
            const guardrail = GUARDRAILS[rule.criterionType];
            return (
              <div key={index} className="rounded-lg border bg-background p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Criterion {index + 1}</span>
                  {rules.length > 1 && (
                    <button type="button" onClick={() => removeRule(index)} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-destructive" aria-label={`Remove criterion ${index + 1}`}>
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Type">
                    <Select
                      value={rule.criterionType}
                      onChange={(e) => {
                        const ct = e.target.value as CriterionType;
                        updateRule(index, "criterionType", ct);
                        if (!rule.lookbackMonths && DEFAULT_LOOKBACK_MONTHS[ct]) updateRule(index, "lookbackMonths", DEFAULT_LOOKBACK_MONTHS[ct]);
                      }}
                    >
                      {CRITERION_TYPES.map((ct) => (
                        <option key={ct.value} value={ct.value}>
                          {ct.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Label">
                    <Input value={rule.label} onChange={(e) => updateRule(index, "label", e.target.value)} required placeholder="Minimum credit score" />
                  </Field>
                  <Field label="Operator">
                    <Select value={rule.operator} onChange={(e) => updateRule(index, "operator", e.target.value)}>
                      {OPERATORS.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Threshold">
                    <Input value={rule.value} onChange={(e) => updateRule(index, "value", e.target.value)} required placeholder="620" />
                  </Field>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <Checkbox label="Disqualifying" checked={rule.isDisqualifying} onChange={(e) => updateRule(index, "isDisqualifying", e.target.checked)} />
                  <Checkbox label="Mitigation permitted" checked={rule.mitigationAllowed} onChange={(e) => updateRule(index, "mitigationAllowed", e.target.checked)} />
                  <label className="flex items-center gap-2 text-sm">
                    Lookback
                    <Input
                      type="number"
                      min={1}
                      className="h-8 w-20"
                      value={rule.lookbackMonths ?? ""}
                      onChange={(e) => updateRule(index, "lookbackMonths", e.target.value ? parseInt(e.target.value, 10) : null)}
                      placeholder="—"
                      aria-label="Lookback months"
                    />
                    <span className="text-muted-foreground">months</span>
                  </label>
                </div>
                {guardrail && (
                  <p className="mt-3 flex gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    {guardrail}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end border-t pt-4">
          <Button type="submit" loading={isPending}>
            Save &amp; publish
          </Button>
        </div>
      </form>
    </div>
  );
}
