import { getApplications } from "@/actions/application";
import { PageHeader } from "@/components/shared/page-header";
import { UploadForm } from "./upload-form";

export default async function UploadPage() {
  const applications = await getApplications({ status: "PENDING" });

  return (
    <div>
      <PageHeader
        title="Upload Screening Data"
        description="Ingest vendor screening records for applicant review (Spec \u00a74.B)"
      />
      <UploadForm applications={applications} />
    </div>
  );
}
