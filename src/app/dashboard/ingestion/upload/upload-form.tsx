"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Upload } from "lucide-react";
import { ingestScreeningRecords } from "@/actions/ingestion";
import { toast } from "@/lib/toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";

const VENDOR_NAMES = ["TransUnion SmartMove", "Experian RentBureau", "Equifax", "CoreLogic", "RealPage", "Checkr", "Manual entry"] as const;

const RECORD_TYPES = [
  "CREDIT_REPORT",
  "CRIMINAL_HISTORY",
  "EVICTION_HISTORY",
  "EMPLOYMENT_VERIFICATION",
  "RENTAL_HISTORY",
  "INCOME_VERIFICATION",
  "IDENTITY_VERIFICATION",
] as const;

const MAX_BYTES = 2 * 1024 * 1024;

interface Application {
  id: string;
  applicant: { firstName: string; lastName: string };
  property: { name: string };
  status: string;
}

export function UploadForm({ applications }: { applications: Application[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [vendorName, setVendorName] = useState("");
  const [recordType, setRecordType] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [summary, setSummary] = useState("");
  const [disposition, setDisposition] = useState("");
  const [dateOccurred, setDateOccurred] = useState("");
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error("Files must be 2 MB or smaller.");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setFileContent(reader.result as string);
    reader.readAsText(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!applicationId || !vendorName || !recordType) {
      toast.error("Choose an application, vendor, and record type.");
      return;
    }

    let rawData: Record<string, unknown> = {};
    if (fileContent) {
      try {
        const parsed = JSON.parse(fileContent);
        rawData = typeof parsed === "object" && parsed !== null ? parsed : { value: parsed };
      } catch {
        rawData = { rawText: fileContent.slice(0, 200_000), fileName };
      }
    }

    startTransition(async () => {
      const result = await ingestScreeningRecords(applicationId, [
        {
          vendorName,
          recordType,
          rawData,
          normalizedData: rawData,
          summary: summary || undefined,
          disposition: disposition || undefined,
          dateOccurred: dateOccurred || undefined,
        },
      ]);
      if (result.success) {
        toast.success("Record ingested — run the screening pipeline to evaluate it");
        router.push(`/dashboard/applications/${applicationId}/records`);
      } else {
        toast.error(result.error ?? "Failed to ingest record.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
      <Card className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <Field label="Application" htmlFor="applicationId" required className="sm:col-span-2" hint={applications.length === 0 ? "No open applications. Every current application already has a final determination." : undefined}>
          <Select id="applicationId" value={applicationId} onChange={(e) => setApplicationId(e.target.value)} required>
            <option value="">Select an application…</option>
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.applicant.firstName} {app.applicant.lastName} — {app.property.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Consumer reporting agency" htmlFor="vendorName" required>
          <Select id="vendorName" value={vendorName} onChange={(e) => setVendorName(e.target.value)} required>
            <option value="">Select a vendor…</option>
            {VENDOR_NAMES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Record type" htmlFor="recordType" required>
          <Select id="recordType" value={recordType} onChange={(e) => setRecordType(e.target.value)} required>
            <option value="">Select a type…</option>
            {RECORD_TYPES.map((rt) => (
              <option key={rt} value={rt}>
                {rt.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Summary" className="sm:col-span-2">
          <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} placeholder="e.g., Unlawful detainer filed 2022, dismissed" />
        </Field>
        <Field label="Disposition">
          <Input value={disposition} onChange={(e) => setDisposition(e.target.value)} placeholder="e.g., dismissed, satisfied, convicted" />
        </Field>
        <Field label="Date of event">
          <Input type="date" value={dateOccurred} onChange={(e) => setDateOccurred(e.target.value)} />
        </Field>
      </Card>

      <Card className="p-5 sm:p-6">
        <p className="mb-2 text-sm font-medium">Vendor export (optional)</p>
        <label
          htmlFor="fileUpload"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-muted/40 p-8 text-center transition-colors hover:border-primary/40 hover:bg-muted"
        >
          {fileName ? <FileUp className="size-7 text-primary" /> : <Upload className="size-7 text-muted-foreground" />}
          <span className="text-sm font-medium">{fileName ?? "Click to choose or drag a file here"}</span>
          <span className="text-xs text-muted-foreground">JSON, CSV, XML, or TXT · up to 2 MB</span>
          <input id="fileUpload" type="file" accept=".json,.csv,.xml,.txt" className="sr-only" onChange={(e) => handleFile(e.target.files?.[0])} />
        </label>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={() => router.push("/dashboard/ingestion")} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" loading={isPending}>
          Ingest record
        </Button>
      </div>
    </form>
  );
}
