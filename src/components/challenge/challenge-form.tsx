"use client";
// Spec §4.I — Three challenge types: Accuracy, Relevance, Mitigation
import { useState, useTransition } from "react";
import { submitChallenge } from "@/actions/challenge";
import { toast } from "sonner";

export function ChallengeForm({ applicationId }: { applicationId: string }) {
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<"ACCURACY" | "RELEVANCE" | "MITIGATION">("ACCURACY");
  const [description, setDescription] = useState("");
  const [circumstanceType, setCircumstanceType] = useState("");
  const [mitigatingEvidence, setMitigatingEvidence] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await submitChallenge({
        applicationId, type, description, recordIds: ["all"],
        ...(type === "MITIGATION" && { circumstanceType, mitigatingEvidence }),
      });
      if (result.success) {
        toast.success("Challenge submitted for review");
        setDescription(""); setCircumstanceType(""); setMitigatingEvidence("");
      } else { toast.error(result.error ?? "Failed to submit"); }
    });
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Submit New Challenge</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Challenge Type</label>
          <div className="flex gap-2">
            {(["ACCURACY", "RELEVANCE", "MITIGATION"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`px-4 py-2 rounded-md text-sm border transition-colors ${type === t ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                {t === "ACCURACY" ? "Dispute Accuracy" : t === "RELEVANCE" ? "Challenge Relevance" : "Provide Mitigation"}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {type === "ACCURACY" ? "This record is wrong or inaccurate." : type === "RELEVANCE" ? "This record is accurate but should not affect the decision." : "This happened, but here is why it is not predictive now."}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={3} placeholder="Explain your challenge in detail..." className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
        </div>

        {type === "MITIGATION" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Circumstance Type</label>
              <select value={circumstanceType} onChange={(e) => setCircumstanceType(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="">Select...</option>
                <option value="job_loss">Job Loss</option>
                <option value="medical">Medical Emergency</option>
                <option value="domestic_violence">Domestic Violence</option>
                <option value="identity_theft">Identity Theft</option>
                <option value="rehabilitation">Rehabilitation Program</option>
                <option value="education">Education/Training Completion</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mitigating Evidence</label>
              <textarea value={mitigatingEvidence} onChange={(e) => setMitigatingEvidence(e.target.value)} rows={3} placeholder="Describe how circumstances have changed..." className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            </div>
          </>
        )}

        <button type="submit" disabled={isPending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
          {isPending ? "Submitting..." : "Submit Challenge"}
        </button>
      </form>
    </div>
  );
}
