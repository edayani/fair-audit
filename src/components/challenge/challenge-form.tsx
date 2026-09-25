"use client";
// Spec §4.I — Three challenge types: Accuracy, Relevance, Mitigation
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Scale, XCircle } from "lucide-react";
import { resolveChallenge, submitChallenge } from "@/actions/challenge";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/form";
import { cn, humanize } from "@/lib/utils";

const TYPES = [
  { value: "ACCURACY", title: "Dispute accuracy", body: "The record is wrong, incomplete, or belongs to someone else." },
  { value: "RELEVANCE", title: "Challenge relevance", body: "The record is accurate but has no bearing on tenancy." },
  { value: "MITIGATION", title: "Offer mitigation", body: "It happened, but later circumstances show it is not predictive." },
] as const;

type ChallengeType = (typeof TYPES)[number]["value"];

export function ChallengeForm({
  applicationId,
  records,
}: {
  applicationId: string;
  records: Array<{ id: string; recordType: string; vendorName: string }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<ChallengeType>("ACCURACY");
  const [recordIds, setRecordIds] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [circumstanceType, setCircumstanceType] = useState("");
  const [mitigatingEvidence, setMitigatingEvidence] = useState("");

  function toggleRecord(id: string) {
    setRecordIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (recordIds.length === 0) {
      toast.error("Select at least one record the challenge concerns.");
      return;
    }
    startTransition(async () => {
      const result = await submitChallenge({
        applicationId,
        type,
        description,
        recordIds,
        ...(type === "MITIGATION" && { circumstanceType: circumstanceType || undefined, mitigatingEvidence: mitigatingEvidence || undefined }),
      });
      if (result.success) {
        toast.success("Challenge filed and routed for a written resolution");
        setDescription("");
        setCircumstanceType("");
        setMitigatingEvidence("");
        setRecordIds([]);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to submit");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-card">
      <div className="border-b px-5 py-4 sm:px-6">
        <h3 className="text-[15px] font-semibold">File a challenge on the applicant&apos;s behalf</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">Notice and a meaningful opportunity to be heard — every challenge requires a written resolution.</p>
      </div>
      <div className="space-y-5 px-5 py-5 sm:px-6">
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Challenge type">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={type === t.value}
              onClick={() => setType(t.value)}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors",
                type === t.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-accent"
              )}
            >
              <span className="block text-sm font-medium">{t.title}</span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{t.body}</span>
            </button>
          ))}
        </div>

        <Field label="Records at issue" required>
          {records.length === 0 ? (
            <p className="text-sm text-muted-foreground">This application has no screening records to challenge.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {records.map((r) => (
                <label
                  key={r.id}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                    recordIds.includes(r.id) ? "border-primary bg-primary/5" : "hover:bg-accent"
                  )}
                >
                  <input type="checkbox" className="size-3.5 accent-[var(--primary)]" checked={recordIds.includes(r.id)} onChange={() => toggleRecord(r.id)} />
                  {humanize(r.recordType)} <span className="text-xs text-muted-foreground">· {r.vendorName}</span>
                </label>
              ))}
            </div>
          )}
        </Field>

        <Field label="Applicant's statement" required>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} minLength={10} required placeholder="In the applicant's words, what is disputed and why…" />
        </Field>

        {type === "MITIGATION" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Circumstance">
              <Select value={circumstanceType} onChange={(e) => setCircumstanceType(e.target.value)}>
                <option value="">Select…</option>
                <option value="domestic_violence">Domestic violence (VAWA protections may apply)</option>
                <option value="medical">Medical emergency</option>
                <option value="job_loss">Job loss or income interruption</option>
                <option value="homelessness">Period of homelessness</option>
                <option value="identity_theft">Identity theft</option>
                <option value="rehabilitation">Rehabilitation or treatment program</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Mitigating evidence">
              <Textarea value={mitigatingEvidence} onChange={(e) => setMitigatingEvidence(e.target.value)} rows={2} placeholder="Documents or facts offered…" />
            </Field>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" loading={isPending}>
            File challenge
          </Button>
        </div>
      </div>
    </form>
  );
}

export function ChallengeResolver({ challengeId }: { challengeId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [resolution, setResolution] = useState("");
  const [open, setOpen] = useState(false);

  function resolve(status: "RESOLVED_ACCEPTED" | "RESOLVED_REJECTED") {
    if (!resolution.trim()) {
      toast.error("Write the resolution before deciding the challenge.");
      return;
    }
    startTransition(async () => {
      const result = await resolveChallenge(challengeId, status, resolution);
      if (result.success) {
        toast.success(status === "RESOLVED_ACCEPTED" ? "Challenge sustained" : "Challenge denied");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to resolve");
      }
    });
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Scale />
        Resolve
      </Button>
    );
  }

  return (
    <div className="mt-3 w-full space-y-2 rounded-lg border bg-muted/40 p-3">
      <Textarea value={resolution} onChange={(e) => setResolution(e.target.value)} rows={2} placeholder="Written resolution explaining the finding…" />
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={isPending}>
          Cancel
        </Button>
        <Button variant="outline" size="sm" onClick={() => resolve("RESOLVED_REJECTED")} disabled={isPending}>
          <XCircle />
          Deny challenge
        </Button>
        <Button variant="success" size="sm" onClick={() => resolve("RESOLVED_ACCEPTED")} loading={isPending}>
          {!isPending && <CheckCircle2 />}
          Sustain challenge
        </Button>
      </div>
    </div>
  );
}
