"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProperty } from "@/actions/property";
import { PageHeader } from "@/components/shared/page-header";
import { PreviewGate } from "@/components/shared/preview-gate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { toast } from "@/lib/toast";

export default function NewPropertyPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ name: "", address: "", city: "", state: "", zipCode: "", unitCount: "" });
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createProperty({
        ...form,
        unitCount: form.unitCount ? parseInt(form.unitCount, 10) : undefined,
      });
      if (result.success) {
        toast.success("Property created — next, publish its screening policy");
        router.push(`/dashboard/properties/${result.data!.id}/policy`);
      } else {
        toast.error(result.error ?? "Failed to create property");
      }
    });
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        back={{ href: "/dashboard/properties", label: "Properties" }}
        eyebrow="New property"
        title="Add a property"
        description="Location determines which state and local fair-housing overlays apply to the property's screening policy."
      />
      <PreviewGate label="Full access required to add properties">
        <Card>
          <form onSubmit={handleSubmit} className="grid gap-4 p-5 sm:grid-cols-6 sm:p-6">
            <Field label="Property name" htmlFor="name" required className="sm:col-span-6">
              <Input id="name" value={form.name} onChange={set("name")} required placeholder="e.g., Mission Street Family Apartments" />
            </Field>
            <Field label="Street address" htmlFor="address" className="sm:col-span-6">
              <Input id="address" value={form.address} onChange={set("address")} autoComplete="street-address" />
            </Field>
            <Field label="City" htmlFor="city" className="sm:col-span-3">
              <Input id="city" value={form.city} onChange={set("city")} autoComplete="address-level2" />
            </Field>
            <Field label="State" htmlFor="state" className="sm:col-span-1">
              <Input id="state" value={form.state} onChange={set("state")} maxLength={2} placeholder="CA" autoComplete="address-level1" />
            </Field>
            <Field label="ZIP" htmlFor="zip" className="sm:col-span-2">
              <Input id="zip" value={form.zipCode} onChange={set("zipCode")} inputMode="numeric" autoComplete="postal-code" />
            </Field>
            <Field label="Unit count" htmlFor="units" className="sm:col-span-2">
              <Input id="units" type="number" min={0} value={form.unitCount} onChange={set("unitCount")} />
            </Field>
            <div className="flex justify-end gap-2 border-t pt-4 sm:col-span-6">
              <Button variant="outline" onClick={() => router.back()} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" loading={isPending}>
                Create property
              </Button>
            </div>
          </form>
        </Card>
      </PreviewGate>
    </div>
  );
}
