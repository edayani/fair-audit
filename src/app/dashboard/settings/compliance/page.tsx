import { getComplianceMode } from "@/actions/jurisdiction";
import { PageHeader } from "@/components/shared/page-header";
import { ComplianceModeToggle } from "@/components/jurisdiction/compliance-mode-toggle";
import { COMPLIANCE_MODE_DESCRIPTIONS } from "@/lib/constants/jurisdictions";

export default async function CompliancePage() {
  const { complianceMode, complianceModeDisclaimerAckedAt } = await getComplianceMode();

  return (
    <div className="max-w-2xl">
      <PageHeader title="Compliance Mode" description="Configure which legal framework governs screening decisions" />
      <ComplianceModeToggle currentMode={complianceMode} disclaimerAckedAt={complianceModeDisclaimerAckedAt} />
    </div>
  );
}
