"use client";
// Spec §4.A — Policy Configuration Engine
import { useState, useTransition } from "react";
import { createPolicy, publishPolicy, parseNaturalLanguagePolicy } from "@/actions/policy";
import { CRITERION_TYPES, OPERATORS } from "@/lib/constants/screening-criteria";
import { toast } from "@/lib/toast";
import { Plus, Sparkles, Trash2 } from "lucide-react";

interface PolicyRule {
  criterionType: string;
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
  criterionType: "CREDIT_SCORE", label: "", operator: "GTE", value: "",
  weight: 1.0, isDisqualifying: false, lookbackMonths: null, mitigationAllowed: true, waiverConditions: null,
};

export function PolicyForm({ propertyId }: { propertyId: string }) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [rules, setRules] = useState<PolicyRule[]>([{ ...emptyRule }]);
  const [nlText, setNlText] = useState("");
  const [showNlParser, setShowNlParser] = useState(false);

  function addRule() { setRules((prev) => [...prev, { ...emptyRule }]); }
  function removeRule(index: number) { setRules((prev) => prev.filter((_, i) => i !== index)); }
  function updateRule(index: number, field: string, value: unknown) {
    setRules((prev) => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createPolicy({ propertyId, name, rules: rules.map((r, i) => ({ ...r, criterionType: r.criterionType as "CRIMINAL_HISTORY" | "CREDIT_SCORE" | "EVICTION_HISTORY" | "INCOME_REQUIREMENT" | "RENTAL_HISTORY" | "EMPLOYMENT_HISTORY" | "DEBT_TO_INCOME" | "SOURCE_OF_INCOME" | "CUSTOM", sortOrder: i })) });
      if (result.success) {
        toast.success("Policy created");
        const pubResult = await publishPolicy(result.data!.id);
        if (pubResult.success) toast.success("Policy published and active");
      } else {
        toast.error(result.error ?? "Failed to create policy");
      }
    });
  }

  function handleNlParse() {
    // §4.A — LLM use case 1: NL policy parser, human approval required
    startTransition(async () => {
      const result = await parseNaturalLanguagePolicy(nlText);
      if (result.success && result.data) {
        setRules(result.data.map((r) => ({
          criterionType: r.criterionType || "CUSTOM",
          label: r.label || "",
          operator: r.operator || "GTE",
          value: r.value || "",
          weight: 1.0,
          isDisqualifying: r.isDisqualifying || false,
          lookbackMonths: r.lookbackMonths,
          mitigationAllowed: r.mitigationAllowed ?? true,
          waiverConditions: r.waiverConditions,
        })));
        toast.success("Policy parsed from natural language. Please review before saving.");
        setShowNlParser(false);
      } else {
        toast.error(result.error ?? "Failed to parse policy");
      }
    });
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Create New Policy Version</h3>
        <button onClick={() => setShowNlParser(!showNlParser)} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <Sparkles className="h-4 w-4" /> Parse from Natural Language
        </button>
      </div>

      {showNlParser && (
        <div className="mb-6 p-4 rounded-md bg-muted">
          <p className="text-sm text-muted-foreground mb-2">Describe your screening policy in plain language. The AI will convert it to structured rules for your review.</p>
          <textarea value={nlText} onChange={(e) => setNlText(e.target.value)} rows={4} placeholder="e.g., Minimum credit score of 620. No evictions in the last 5 years. Income must be at least 3x rent..." className="w-full rounded-md border bg-background px-3 py-2 text-sm mb-2" />
          <button onClick={handleNlParse} disabled={isPending || !nlText.trim()} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {isPending ? "Parsing..." : "Parse Policy"}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Policy Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g., Standard Screening v2" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Screening Rules</h4>
            <button type="button" onClick={addRule} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              <Plus className="h-4 w-4" /> Add Rule
            </button>
          </div>

          {rules.map((rule, index) => (
            <div key={index} className="rounded-md border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Rule {index + 1}</span>
                {rules.length > 1 && (
                  <button type="button" onClick={() => removeRule(index)} className="text-destructive hover:text-destructive/80"><Trash2 className="h-4 w-4" /></button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Criterion Type</label>
                  <select value={rule.criterionType} onChange={(e) => updateRule(index, "criterionType", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                    {CRITERION_TYPES.map((ct) => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Label</label>
                  <input value={rule.label} onChange={(e) => updateRule(index, "label", e.target.value)} required placeholder="e.g., Minimum credit score" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Operator</label>
                  <select value={rule.operator} onChange={(e) => updateRule(index, "operator", e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                    {OPERATORS.map((op) => <option key={op.value} value={op.value}>{op.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Value</label>
                  <input value={rule.value} onChange={(e) => updateRule(index, "value", e.target.value)} required placeholder="e.g., 620" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" checked={rule.isDisqualifying} onChange={(e) => updateRule(index, "isDisqualifying", e.target.checked)} className="rounded" />
                  Disqualifying
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" checked={rule.mitigationAllowed} onChange={(e) => updateRule(index, "mitigationAllowed", e.target.checked)} className="rounded" />
                  Mitigation Allowed
                </label>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-muted-foreground">Lookback (months):</label>
                  <input type="number" value={rule.lookbackMonths ?? ""} onChange={(e) => updateRule(index, "lookbackMonths", e.target.value ? parseInt(e.target.value) : null)} className="w-20 rounded-md border bg-background px-2 py-1 text-sm" placeholder="None" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button type="submit" disabled={isPending} className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {isPending ? "Saving..." : "Save & Publish Policy"}
        </button>
      </form>
    </div>
  );
}
