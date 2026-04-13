"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitAccommodation } from "@/actions/challenge";
import { toast } from "sonner";

const ACCOMMODATION_TYPES = [
  "Extended Deadline",
  "Alternative Format",
  "Communication Assistance",
  "Modified Process",
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
      const result = await submitAccommodation({
        applicationId,
        accommodationType,
        description,
        isDisabilityRelated,
      });
      if (result.success) {
        toast.success("Accommodation request submitted");
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
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Request Accommodation</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Accommodation Type</label>
          <select
            value={accommodationType}
            onChange={(e) => setAccommodationType(e.target.value)}
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">Select type...</option>
            {ACCOMMODATION_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={10}
            rows={3}
            placeholder="Describe the accommodation you need..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isDisabilityRelated}
              onChange={(e) => setIsDisabilityRelated(e.target.checked)}
              className="rounded border"
            />
            <span className="font-medium">Disability-Related</span>
          </label>
          <p className="text-xs text-muted-foreground mt-1 ml-6">
            Check if this accommodation request is related to a disability. Per the ADA and FHA, we will never request or store information about the specific nature of any disability.
          </p>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {isPending ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}
