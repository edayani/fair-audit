"use client";

import { useState, useTransition } from "react";
import { createProperty } from "@/actions/property";
import { PageHeader } from "@/components/shared/page-header";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function NewPropertyPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({ name: "", address: "", city: "", state: "", zipCode: "", unitCount: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createProperty({
        ...formData,
        unitCount: formData.unitCount ? parseInt(formData.unitCount) : undefined,
      });
      if (result.success) {
        toast.success("Property created");
        router.push(`/dashboard/properties/${result.data!.id}`);
      } else {
        toast.error(result.error ?? "Failed to create property");
      }
    });
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Add Property" description="Create a new property for screening management" />
      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { key: "name", label: "Property Name", required: true },
          { key: "address", label: "Address" },
          { key: "city", label: "City" },
          { key: "state", label: "State" },
          { key: "zipCode", label: "ZIP Code" },
          { key: "unitCount", label: "Unit Count", type: "number" },
        ].map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium mb-1">{field.label}</label>
            <input
              type={field.type ?? "text"}
              required={field.required}
              value={formData[field.key as keyof typeof formData]}
              onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        ))}
        <button type="submit" disabled={isPending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {isPending ? "Creating..." : "Create Property"}
        </button>
      </form>
    </div>
  );
}
