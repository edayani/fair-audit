import { getComplianceMode } from "@/actions/jurisdiction";
import { getAuthContext } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { ComplianceModeToggle } from "@/components/jurisdiction/compliance-mode-toggle";

export const metadata = { title: "Legal standard" };

export default async function CompliancePage() {
  const [{ complianceMode, complianceModeDisclaimerAckedAt }, ctx] = await Promise.all([getComplianceMode(), getAuthContext()]);

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Administration"
        title="Governing legal standard"
        description="Choose the body of law against which screening criteria, relevance labels, and disparate-impact findings are evaluated. The most protective applicable standard is the default."
      />
      <ComplianceModeToggle currentMode={complianceMode} disclaimerAckedAt={complianceModeDisclaimerAckedAt} canEdit={ctx.accessTier === "FULL"} />
    </div>
  );
}
