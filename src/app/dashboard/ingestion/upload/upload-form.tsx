"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { ingestScreeningRecords } from "@/actions/ingestion";
import { Upload } from "lucide-react";

const VENDOR_NAMES = [
  "TransUnion",
  "Experian",
  "CoreLogic",
  "RentPrep",
  "Manual",
] as const;

const RECORD_TYPES = [
  "CREDIT_REPORT",
  "CRIMINAL_HISTORY",
  "EVICTION_HISTORY",
  "EMPLOYMENT_VERIFICATION",
  "RENTAL_HISTORY",
  "INCOME_VERIFICATION",
] as const;

type RecordType = (typeof RECORD_TYPES)[number];

interface Application {
  id: string;
  applicant: { firstName: string; lastName: string };
  property: { name: string };
  status: string;
}

export function UploadForm({
  applications,
}: {
  applications: Application[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [vendorName, setVendorName] = useState("");
  const [recordType, setRecordType] = useState<RecordType | "">("");
  const [applicationId, setApplicationId] = useState("");
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setFileContent(reader.result as string);
    };
    reader.readAsText(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!applicationId || !vendorName || !recordType) {
      toast.error("Please fill in all required fields.");
      return;
    }

    let rawData: Record<string, unknown> = {};
    if (fileContent) {
      try {
        rawData = JSON.parse(fileContent);
      } catch {
        rawData = { rawText: fileContent, fileName };
      }
    }

    startTransition(async () => {
      const result = await ingestScreeningRecords(applicationId, [
        {
          vendorName,
          recordType,
          rawData,
          normalizedData: rawData,
        },
      ]);

      if (result.success) {
        toast.success(
          `Ingested ${result.data?.count ?? 1} record(s) successfully.`
        );
        router.push("/dashboard/ingestion");
      } else {
        toast.error(result.error ?? "Failed to ingest record.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {/* Vendor Name */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <label
            htmlFor="vendorName"
            className="block text-sm font-medium mb-1.5"
          >
            Vendor Name
          </label>
          <select
            id="vendorName"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
          >
            <option value="">Select a vendor...</option>
            {VENDOR_NAMES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* Record Type */}
        <div>
          <label
            htmlFor="recordType"
            className="block text-sm font-medium mb-1.5"
          >
            Record Type
          </label>
          <select
            id="recordType"
            value={recordType}
            onChange={(e) => setRecordType(e.target.value as RecordType)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
          >
            <option value="">Select a record type...</option>
            {RECORD_TYPES.map((rt) => (
              <option key={rt} value={rt}>
                {rt.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Application */}
        <div>
          <label
            htmlFor="applicationId"
            className="block text-sm font-medium mb-1.5"
          >
            Application
          </label>
          <select
            id="applicationId"
            value={applicationId}
            onChange={(e) => setApplicationId(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
          >
            <option value="">Select an application...</option>
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.applicant.firstName} {app.applicant.lastName} &mdash;{" "}
                {app.property.name}
              </option>
            ))}
          </select>
          {applications.length === 0 && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              No pending applications found. Create an application first.
            </p>
          )}
        </div>
      </div>

      {/* File Upload */}
      <div className="rounded-lg border bg-card p-6">
        <label className="block text-sm font-medium mb-1.5">
          Screening Data File
        </label>
        <label
          htmlFor="fileUpload"
          className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-8 text-center cursor-pointer transition-colors hover:border-muted-foreground/50 hover:bg-muted"
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          {fileName ? (
            <span className="text-sm font-medium">{fileName}</span>
          ) : (
            <>
              <span className="text-sm font-medium">
                Click to upload or drag and drop
              </span>
              <span className="text-xs text-muted-foreground">
                JSON, CSV, or XML vendor export files
              </span>
            </>
          )}
          <input
            id="fileUpload"
            type="file"
            accept=".json,.csv,.xml,.txt"
            className="sr-only"
            onChange={handleFileChange}
          />
        </label>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
        >
          {isPending ? "Uploading..." : "Submit Record"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/ingestion")}
          className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
