import { getApplications } from "@/actions/application";
import { PageHeader } from "@/components/shared/page-header";
import { PreviewGate } from "@/components/shared/preview-gate";
import { UploadForm } from "./upload-form";

export const metadata = { title: "Ingest vendor data" };

export default async function UploadPage() {
  const applications = await getApplications();
  const open = applications.filter((a) => a.status !== "DECIDED" && a.status !== "WITHDRAWN");

  return (
    <div>
      <PageHeader
        back={{ href: "/dashboard/ingestion", label: "Data intake" }}
        eyebrow="Data intake"
        title="Ingest vendor data"
        description="Attach a consumer-report export to an open application. Records are normalized, then matched and labeled when the screening pipeline runs."
      />
      <PreviewGate label="Full access required to ingest data">
        <UploadForm
          applications={open.map((a) => ({
            id: a.id,
            applicant: { firstName: a.applicant.firstName, lastName: a.applicant.lastName },
            property: { name: a.property.name },
            status: a.status,
          }))}
        />
      </PreviewGate>
    </div>
  );
}
