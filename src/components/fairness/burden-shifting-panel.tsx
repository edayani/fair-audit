"use client";

import { useState, useTransition } from "react";
import { submitBurdenShiftingAnalysis } from "@/actions/fairness";
import { toast } from "@/lib/toast";
import { Scale } from "lucide-react";

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
}

interface Props {
  disparityReportId: string;
  protectedClass: string;
  impactRatio: number;
  existing?: BurdenShiftingAnalysis | null;
}

function YesNoToggle({
  value,
  onChange,
  readOnly,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
  readOnly?: boolean;
}) {
  if (readOnly) {
    return (
      <span className={value === true ? "text-green-600 font-medium" : value === false ? "text-red-600 font-medium" : "text-muted-foreground"}>
        {value === true ? "Yes" : value === false ? "No" : "Not assessed"}
      </span>
    );
  }
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-3 py-1 rounded-md text-sm border transition-colors ${value === true ? "bg-green-600 text-white border-green-600" : "hover:bg-muted"}`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-3 py-1 rounded-md text-sm border transition-colors ${value === false ? "bg-red-600 text-white border-red-600" : "hover:bg-muted"}`}
      >
        No
      </button>
    </div>
  );
}

export function BurdenShiftingPanel({ disparityReportId, protectedClass, impactRatio, existing }: Props) {
  const [isPending, startTransition] = useTransition();
  const readOnly = !!existing;

  const [isFaciallyNeutral, setIsFaciallyNeutral] = useState<boolean | null>(existing?.isFaciallyNeutral ?? null);
  const [facialNeutralityNotes, setFacialNeutralityNotes] = useState(existing?.facialNeutralityNotes ?? "");
  const [lessDiscriminatoryAltExists, setLessDiscriminatoryAltExists] = useState<boolean | null>(existing?.lessDiscriminatoryAltExists ?? null);
  const [lessDiscriminatoryAltNotes, setLessDiscriminatoryAltNotes] = useState(existing?.lessDiscriminatoryAltNotes ?? "");
  const [hasLegitimateObjective, setHasLegitimateObjective] = useState<boolean | null>(existing?.hasLegitimateObjective ?? null);
  const [legitimateObjectiveNotes, setLegitimateObjectiveNotes] = useState(existing?.legitimateObjectiveNotes ?? "");
  const [conclusion, setConclusion] = useState(existing?.conclusion ?? "");
  const [analystNotes, setAnalystNotes] = useState(existing?.analystNotes ?? "");

  const [openProng, setOpenProng] = useState<number | null>(null);

  function toggleProng(n: number) {
    setOpenProng(openProng === n ? null : n);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await submitBurdenShiftingAnalysis(disparityReportId, {
        protectedClass,
        impactRatio,
        isFaciallyNeutral: isFaciallyNeutral ?? undefined,
        facialNeutralityNotes: facialNeutralityNotes || undefined,
        lessDiscriminatoryAltExists: lessDiscriminatoryAltExists ?? undefined,
        lessDiscriminatoryAltNotes: lessDiscriminatoryAltNotes || undefined,
        hasLegitimateObjective: hasLegitimateObjective ?? undefined,
        legitimateObjectiveNotes: legitimateObjectiveNotes || undefined,
        conclusion: conclusion || undefined,
        analystNotes: analystNotes || undefined,
      });
      if (result.success) {
        toast.success("Burden-shifting analysis saved");
      } else {
        toast.error(result.error ?? "Failed to save analysis");
      }
    });
  }

  return (
    <div className="border-l-4 border-amber-500 rounded-lg border bg-card p-6 mt-4">
      <div className="flex items-center gap-2 mb-1">
        <Scale className="h-5 w-5 text-amber-600" />
        <h4 className="font-semibold">HUD Burden-Shifting Analysis</h4>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        24 CFR &sect; 100.500; <em>Texas Dept. of Housing v. Inclusive Communities Project</em>, 576 U.S. 519 (2015)
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Prong 1 */}
        <div className="border rounded-md">
          <button type="button" onClick={() => toggleProng(1)} className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors">
            <span className="font-medium text-sm">Prong 1: Facial Neutrality</span>
            <span className="text-xs text-muted-foreground">{openProng === 1 ? "Collapse" : "Expand"}</span>
          </button>
          {openProng === 1 && (
            <div className="p-3 pt-0 space-y-3">
              <p className="text-sm">Is the challenged policy facially neutral (i.e., it does not explicitly reference a protected class)?</p>
              <YesNoToggle value={isFaciallyNeutral} onChange={setIsFaciallyNeutral} readOnly={readOnly} />
              {!readOnly ? (
                <textarea
                  value={facialNeutralityNotes}
                  onChange={(e) => setFacialNeutralityNotes(e.target.value)}
                  rows={2}
                  placeholder="Notes on facial neutrality..."
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              ) : facialNeutralityNotes ? (
                <p className="text-sm text-muted-foreground">{facialNeutralityNotes}</p>
              ) : null}
              <p className="text-xs text-muted-foreground italic">
                A facially neutral policy may still violate the FHA if it has a discriminatory effect. &mdash; <em>Inclusive Communities</em>, 576 U.S. at 524
              </p>
            </div>
          )}
        </div>

        {/* Prong 2 */}
        <div className="border rounded-md">
          <button type="button" onClick={() => toggleProng(2)} className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors">
            <span className="font-medium text-sm">Prong 2: Less Discriminatory Alternative</span>
            <span className="text-xs text-muted-foreground">{openProng === 2 ? "Collapse" : "Expand"}</span>
          </button>
          {openProng === 2 && (
            <div className="p-3 pt-0 space-y-3">
              <p className="text-sm">Does a less discriminatory alternative exist that would serve the same legitimate objective?</p>
              <YesNoToggle value={lessDiscriminatoryAltExists} onChange={setLessDiscriminatoryAltExists} readOnly={readOnly} />
              {!readOnly ? (
                <textarea
                  value={lessDiscriminatoryAltNotes}
                  onChange={(e) => setLessDiscriminatoryAltNotes(e.target.value)}
                  rows={2}
                  placeholder="Notes on less discriminatory alternatives..."
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              ) : lessDiscriminatoryAltNotes ? (
                <p className="text-sm text-muted-foreground">{lessDiscriminatoryAltNotes}</p>
              ) : null}
              <p className="text-xs text-muted-foreground italic">
                The burden shifts to the plaintiff to show that a less discriminatory alternative is available. &mdash; 24 CFR &sect; 100.500(c)(3)
              </p>
            </div>
          )}
        </div>

        {/* Prong 3 */}
        <div className="border rounded-md">
          <button type="button" onClick={() => toggleProng(3)} className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors">
            <span className="font-medium text-sm">Prong 3: Legitimate Business Objective</span>
            <span className="text-xs text-muted-foreground">{openProng === 3 ? "Collapse" : "Expand"}</span>
          </button>
          {openProng === 3 && (
            <div className="p-3 pt-0 space-y-3">
              <p className="text-sm">Does the policy serve a substantial, legitimate, nondiscriminatory business objective?</p>
              <YesNoToggle value={hasLegitimateObjective} onChange={setHasLegitimateObjective} readOnly={readOnly} />
              {!readOnly ? (
                <textarea
                  value={legitimateObjectiveNotes}
                  onChange={(e) => setLegitimateObjectiveNotes(e.target.value)}
                  rows={2}
                  placeholder="Notes on legitimate business objective..."
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              ) : legitimateObjectiveNotes ? (
                <p className="text-sm text-muted-foreground">{legitimateObjectiveNotes}</p>
              ) : null}
              <p className="text-xs text-muted-foreground italic">
                The respondent must prove that the challenged practice is necessary to achieve a valid interest. &mdash; 24 CFR &sect; 100.500(c)(2)
              </p>
            </div>
          )}
        </div>

        {/* Conclusion */}
        <div>
          <label className="block text-sm font-medium mb-1">Conclusion</label>
          {readOnly ? (
            <span className={`font-medium ${conclusion === "Justified" ? "text-green-600" : conclusion === "Unjustified" ? "text-red-600" : "text-yellow-600"}`}>
              {conclusion || "Not assessed"}
            </span>
          ) : (
            <select
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select conclusion...</option>
              <option value="Justified">Justified</option>
              <option value="Unjustified">Unjustified</option>
              <option value="Needs Further Review">Needs Further Review</option>
            </select>
          )}
        </div>

        {/* Analyst Notes */}
        <div>
          <label className="block text-sm font-medium mb-1">Analyst Notes</label>
          {readOnly ? (
            <p className="text-sm text-muted-foreground">{analystNotes || "None"}</p>
          ) : (
            <textarea
              value={analystNotes}
              onChange={(e) => setAnalystNotes(e.target.value)}
              rows={3}
              placeholder="Additional analysis notes..."
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          )}
        </div>

        {!readOnly && (
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Submit Analysis"}
          </button>
        )}
      </form>
    </div>
  );
}
