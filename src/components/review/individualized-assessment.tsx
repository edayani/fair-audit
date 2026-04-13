"use client";

import { useState, useTransition } from "react";
import { submitIndividualizedAssessment } from "@/actions/assessment";
import { toast } from "sonner";
import { Scale } from "lucide-react";

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
}

interface Props {
  decisionId: string;
  existing?: AssessmentData | null;
  readOnly?: boolean;
}

function ScoreDisplay({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <span className="text-sm tracking-wider">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < score ? "text-amber-600" : "text-gray-300 dark:text-gray-600"}>
          {i < score ? "\u25CF" : "\u25CB"}
        </span>
      ))}
      <span className="ml-1.5 text-xs text-muted-foreground">({score}/{max})</span>
    </span>
  );
}

const FACTOR_1_LABELS = ["Minimal", "Minor", "Moderate", "Serious", "Severe"];
const FACTOR_2_LABELS = ["Very Recent", "Recent", "Moderate", "Distant", "Very Distant"];
const FACTOR_3_LABELS = ["None", "Minimal", "Some", "Significant", "Exceptional"];
const FACTOR_4_LABELS = ["None", "Minimal", "Some", "Significant", "Compelling"];

export function IndividualizedAssessment({ decisionId, existing, readOnly = false }: Props) {
  const [isPending, startTransition] = useTransition();

  const [natureAndSeriousness, setNatureAndSeriousness] = useState(existing?.natureAndSeriousness ?? "");
  const [natureSeverity, setNatureSeverity] = useState(existing?.natureSeverity ?? 0);
  const [timeElapsed, setTimeElapsed] = useState(existing?.timeElapsed ?? "");
  const [timeElapsedMonths, setTimeElapsedMonths] = useState(existing?.timeElapsedMonths ?? 0);
  const [rehabilitation, setRehabilitation] = useState(existing?.rehabilitation ?? "");
  const [rehabilitationScore, setRehabilitationScore] = useState(existing?.rehabilitationScore ?? 0);
  const [mitigatingCircumstances, setMitigatingCircumstances] = useState(existing?.mitigatingCircumstances ?? "");
  const [mitigatingScore, setMitigatingScore] = useState(existing?.mitigatingScore ?? 0);
  const [tenancyNexus, setTenancyNexus] = useState(existing?.tenancyNexus ?? "");
  const [overallAssessment, setOverallAssessment] = useState(existing?.overallAssessment ?? "");
  const [recommendedOutcome, setRecommendedOutcome] = useState(existing?.recommendedOutcome ?? "APPROVE");

  function handleSubmit() {
    if (!natureAndSeriousness.trim() || !timeElapsed.trim() || !rehabilitation.trim() || !tenancyNexus.trim() || !overallAssessment.trim()) {
      toast.error("All text fields are required");
      return;
    }
    if (natureSeverity < 1 || rehabilitationScore < 1 || mitigatingScore < 1) {
      toast.error("All scores must be selected (1-5)");
      return;
    }

    startTransition(async () => {
      const result = await submitIndividualizedAssessment(decisionId, {
        natureAndSeriousness,
        natureSeverity,
        timeElapsed,
        timeElapsedMonths,
        rehabilitation,
        rehabilitationScore,
        mitigatingCircumstances,
        mitigatingScore,
        tenancyNexus,
        overallAssessment,
        recommendedOutcome,
      });
      if (result.success) toast.success("Individualized assessment saved");
      else toast.error(result.error ?? "Failed to save assessment");
    });
  }

  function renderScoreRadios(
    value: number,
    onChange: (v: number) => void,
    labels: string[]
  ) {
    if (readOnly) {
      return <ScoreDisplay score={value} />;
    }
    return (
      <div className="flex items-center gap-3 flex-wrap">
        {labels.map((label, idx) => {
          const score = idx + 1;
          return (
            <label key={score} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name={`score-${label}-${labels[0]}`}
                checked={value === score}
                onChange={() => onChange(score)}
                className="accent-amber-600"
              />
              <span className="text-xs">{score} - {label}</span>
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-l-4 border-amber-500 bg-card p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Scale className="h-5 w-5 text-amber-600" />
          HUD Individualized Assessment
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          HUD Office of General Counsel Guidance on Application of FHA Standards (April 4, 2016)
        </p>
      </div>

      <div className="space-y-6">
        {/* Factor 1: Nature and Seriousness */}
        <div className="rounded-lg border bg-card p-4">
          <h4 className="font-medium mb-2">Factor 1: Nature and Seriousness of the Offense</h4>
          {readOnly ? (
            <p className="text-sm mb-2 whitespace-pre-wrap">{existing?.natureAndSeriousness || "Not provided"}</p>
          ) : (
            <textarea
              value={natureAndSeriousness}
              onChange={(e) => setNatureAndSeriousness(e.target.value)}
              placeholder="Describe the nature and seriousness of the offense(s)..."
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm mb-2"
            />
          )}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Severity Rating:</p>
            {renderScoreRadios(natureSeverity, setNatureSeverity, FACTOR_1_LABELS)}
          </div>
        </div>

        {/* Factor 2: Time Elapsed */}
        <div className="rounded-lg border bg-card p-4">
          <h4 className="font-medium mb-2">Factor 2: Time Elapsed Since the Offense</h4>
          {readOnly ? (
            <p className="text-sm mb-2 whitespace-pre-wrap">{existing?.timeElapsed || "Not provided"}</p>
          ) : (
            <>
              <textarea
                value={timeElapsed}
                onChange={(e) => setTimeElapsed(e.target.value)}
                placeholder="Describe the time elapsed since the criminal conduct and/or completion of sentence..."
                rows={3}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm mb-2"
              />
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-muted-foreground">Months since offense:</label>
                <input
                  type="number"
                  value={timeElapsedMonths}
                  onChange={(e) => setTimeElapsedMonths(parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-20 rounded-md border bg-background px-2 py-1 text-sm"
                />
              </div>
            </>
          )}
          {readOnly && existing?.timeElapsedMonths != null && (
            <p className="text-xs text-muted-foreground mb-2">Months since offense: {existing.timeElapsedMonths}</p>
          )}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Time Distance Rating:</p>
            {renderScoreRadios(
              readOnly ? (existing?.timeElapsedMonths != null ? Math.min(5, Math.max(1, Math.ceil(existing.timeElapsedMonths / 24))) : 0) : Math.min(5, Math.max(timeElapsedMonths > 0 ? 1 : 0, Math.ceil(timeElapsedMonths / 24))),
              () => {},
              FACTOR_2_LABELS
            )}
          </div>
        </div>

        {/* Factor 3: Rehabilitation */}
        <div className="rounded-lg border bg-card p-4">
          <h4 className="font-medium mb-2">Factor 3: Evidence of Rehabilitation or Good Conduct</h4>
          {readOnly ? (
            <p className="text-sm mb-2 whitespace-pre-wrap">{existing?.rehabilitation || "Not provided"}</p>
          ) : (
            <textarea
              value={rehabilitation}
              onChange={(e) => setRehabilitation(e.target.value)}
              placeholder="Describe any evidence of rehabilitation, good conduct, or positive changes..."
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm mb-2"
            />
          )}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Rehabilitation Rating:</p>
            {renderScoreRadios(rehabilitationScore, setRehabilitationScore, FACTOR_3_LABELS)}
          </div>
        </div>

        {/* Factor 4: Mitigating Circumstances */}
        <div className="rounded-lg border bg-card p-4">
          <h4 className="font-medium mb-2">Factor 4: Mitigating Circumstances</h4>
          {readOnly ? (
            <p className="text-sm mb-2 whitespace-pre-wrap">{existing?.mitigatingCircumstances || "Not provided"}</p>
          ) : (
            <textarea
              value={mitigatingCircumstances}
              onChange={(e) => setMitigatingCircumstances(e.target.value)}
              placeholder="Describe any mitigating circumstances (age at time of offense, context, etc.)..."
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm mb-2"
            />
          )}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Mitigating Factors Rating:</p>
            {renderScoreRadios(mitigatingScore, setMitigatingScore, FACTOR_4_LABELS)}
          </div>
        </div>

        {/* Tenancy Nexus */}
        <div className="rounded-lg border bg-card p-4">
          <h4 className="font-medium mb-2">Tenancy Nexus</h4>
          <p className="text-xs text-muted-foreground mb-2">
            How does this offense relate to the applicant&apos;s ability to be a responsible tenant?
          </p>
          {readOnly ? (
            <p className="text-sm whitespace-pre-wrap">{existing?.tenancyNexus || "Not provided"}</p>
          ) : (
            <textarea
              value={tenancyNexus}
              onChange={(e) => setTenancyNexus(e.target.value)}
              placeholder="Explain the connection (or lack thereof) between the offense and tenancy responsibilities..."
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          )}
        </div>

        {/* Overall Assessment */}
        <div className="rounded-lg border bg-card p-4">
          <h4 className="font-medium mb-2">Overall Assessment</h4>
          {readOnly ? (
            <p className="text-sm whitespace-pre-wrap">{existing?.overallAssessment || "Not provided"}</p>
          ) : (
            <textarea
              value={overallAssessment}
              onChange={(e) => setOverallAssessment(e.target.value)}
              placeholder="Provide your overall individualized assessment considering all four HUD factors..."
              rows={4}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          )}
        </div>

        {/* Recommended Outcome */}
        <div className="rounded-lg border bg-card p-4">
          <h4 className="font-medium mb-2">Recommended Outcome</h4>
          {readOnly ? (
            <p className="text-sm font-medium">
              {existing?.recommendedOutcome === "APPROVE" && "Approve"}
              {existing?.recommendedOutcome === "DENY" && "Deny"}
              {existing?.recommendedOutcome === "CONDITIONAL" && "Conditional Approval"}
              {!existing?.recommendedOutcome && "Not provided"}
            </p>
          ) : (
            <select
              value={recommendedOutcome}
              onChange={(e) => setRecommendedOutcome(e.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="APPROVE">Approve</option>
              <option value="DENY">Deny</option>
              <option value="CONDITIONAL">Conditional Approval</option>
            </select>
          )}
        </div>

        {/* Submit button (hidden in readOnly mode) */}
        {!readOnly && (
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="rounded-md bg-amber-600 text-white px-6 py-2 text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
          >
            {isPending ? "Saving..." : existing ? "Update Assessment" : "Submit Assessment"}
          </button>
        )}
      </div>
    </div>
  );
}
