"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { resolveAccommodation, submitAccommodation } from "@/actions/challenge";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Select, Textarea } from "@/components/ui/form";

const ACCOMMODATION_TYPES = [
  "Waiver of screening criterion",
  "Extended deadline",
  "Alternative format or language access",
  "Communication assistance",
  "Third-party representative or advocate",
  "Assistance animal",
  "Modified application process",
  "Other",
];

export function AccommodationForm({ applicationId }: { applicationId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [accommodationType, setAccommodationType] = useState("");
  const [description, setDescription] = useState("");
  const [isDisabilityRelated, setIsDisabilityRelated] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await submitAccommodation({ applicationId, accommodationType, description, isDisabilityRelated });
      if (result.success) {
        toast.success("Accommodation request logged — begin the interactive process");
        setAccommodationType("");
        setDescription("");
        setIsDisabilityRelated(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to submit accommodation request");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-card">
      <div className="border-b px-5 py-4 sm:px-6">
        <h3 className="text-[15px] font-semibold">Log a reasonable accommodation request</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Requests may be made at any time, orally or in writing, by the applicant or someone acting on their behalf.
        </p>
      </div>
      <div className="space-y-4 px-5 py-5 sm:px-6">
        <Field label="Type of accommodation" required>
          <Select value={accommodationType} onChange={(e) => setAccommodationType(e.target.value)} required>
            <option value="">Select…</option>
            {ACCOMMODATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Requested change" required>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={10}
            rows={3}
            placeholder="Describe the rule, policy, practice, or service to be modified and why it is needed…"
          />
        </Field>
        <div>
          <Checkbox label="Disability-related request" checked={isDisabilityRelated} onChange={(e) => setIsDisabilityRelated(e.target.checked)} />
          <p className="mt-1 pl-6 text-xs leading-relaxed text-muted-foreground">
            FairAudit records only that a request is disability-related — never the nature or diagnosis of a disability.
            Verification, where permitted, is limited to the disability-related need for the accommodation.
          </p>
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={isPending}>
            Log request
          </Button>
        </div>
      </div>
    </form>
  );
}

export function AccommodationResolver({ accommodationId }: { accommodationId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [denying, setDenying] = useState(false);
  const [reason, setReason] = useState("");

  function resolve(status: "GRANTED" | "DENIED") {
    startTransition(async () => {
      const result = await resolveAccommodation(accommodationId, status, status === "DENIED" ? reason : undefined);
      if (result.success) {
        toast.success(status === "GRANTED" ? "Accommodation granted" : "Denial recorded with reasons");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to update");
      }
    });
  }

  if (denying) {
    return (
      <div className="mt-3 w-full space-y-2 rounded-lg border bg-muted/40 p-3">
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="Denials are permitted only for undue burden, fundamental alteration, or direct threat — and only after exploring alternatives…"
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDenying(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={() => resolve("DENIED")} loading={isPending}>
            Record denial
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => setDenying(true)} disabled={isPending}>
        <XCircle />
        Deny
      </Button>
      <Button variant="success" size="sm" onClick={() => resolve("GRANTED")} loading={isPending}>
        {!isPending && <CheckCircle2 />}
        Grant
      </Button>
    </div>
  );
}
