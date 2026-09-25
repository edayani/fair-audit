import { FileText } from "lucide-react";
import { getAIAReports, getComplianceScores } from "@/actions/ai-governance";
import { PageHeader } from "@/components/shared/page-header";
import { ComplianceScorecard } from "@/components/ai-governance/compliance-scorecard";
import { AIAGenerator } from "@/components/ai-governance/aia-generator";
import { ModelCard } from "@/components/ai-governance/model-card";
import { PreviewGate } from "@/components/shared/preview-gate";
import { Card, CardContent, CardHeaderRow } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "AI governance" };

const RISK_TONE: Record<string, "success" | "warning" | "danger"> = { LOW: "success", MEDIUM: "warning", HIGH: "danger", UNACCEPTABLE: "danger" };

export default async function AIGovernancePage() {
  const [scores, reports] = await Promise.all([getComplianceScores(), getAIAReports()]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Civil rights analytics"
        authority="NIST AI RMF 1.0 · algorithmic accountability"
        title="AI governance"
        description="Algorithmic accountability for automated screening: measurable fairness, transparency, and human oversight — documented in impact assessments you can hand to a regulator."
      />

      <ComplianceScorecard scores={scores} />

      <Card>
        <CardHeaderRow
          icon={FileText}
          title="Algorithmic impact assessments"
          description="Point-in-time assessments of the screening system, preserved with a content hash."
          actions={
            <PreviewGate label="Full access required">
              <AIAGenerator />
            </PreviewGate>
          }
        />
        {reports.length === 0 ? (
          <CardContent className="text-sm text-muted-foreground">No assessments generated yet.</CardContent>
        ) : (
          <ul className="divide-y">
            {reports.map((report) => (
              <li key={report.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 sm:px-6">
                <div>
                  <p className="text-sm font-medium">Impact assessment · {formatDate(report.reportDate)}</p>
                  <p className="text-xs text-muted-foreground">
                    Fairness {report.fairnessScore.toFixed(0)} · Transparency {report.transparencyScore.toFixed(0)} · Oversight{" "}
                    {report.humanOversightRate.toFixed(0)} · by {report.generatedBy}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={RISK_TONE[report.riskClassification] ?? "neutral"}>Risk: {report.riskClassification.toLowerCase()}</Badge>
                  <Badge>{report.status.toLowerCase()}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ModelCard />
    </div>
  );
}
