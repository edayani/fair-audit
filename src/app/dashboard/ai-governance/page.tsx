import { getComplianceScores, getAIAReports } from "@/actions/ai-governance";
import { PageHeader } from "@/components/shared/page-header";
import { ComplianceScorecard } from "@/components/ai-governance/compliance-scorecard";
import { AIAGenerator } from "@/components/ai-governance/aia-generator";
import { ModelCard } from "@/components/ai-governance/model-card";
import { formatDate } from "@/lib/utils";
import { Brain, FileText, Shield } from "lucide-react";

export default async function AIGovernancePage() {
  const [scores, reports] = await Promise.all([getComplianceScores(), getAIAReports()]);

  const riskBadgeColor = (risk: string) => {
    switch (risk) {
      case "LOW": return "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "MEDIUM": return "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "HIGH": return "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      case "UNACCEPTABLE": return "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-gray-50 text-gray-700";
    }
  };

  return (
    <div>
      <PageHeader title="AI Governance" description="Algorithmic accountability, responsible AI compliance, and impact assessment (NIST AI RMF)" />

      <ComplianceScorecard scores={scores} />

      <div className="mt-8">
        <ModelCard />
      </div>

      <div className="mt-8 rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Algorithmic Impact Assessments</h3>
          </div>
          <AIAGenerator />
        </div>

        {reports.length > 0 ? (
          <div className="space-y-2">
            {reports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-3 rounded-md border hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      AIA Report &mdash; {formatDate(report.reportDate)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Fairness: {report.fairnessScore.toFixed(1)} | Transparency: {report.transparencyScore.toFixed(1)} | Oversight: {report.humanOversightRate.toFixed(1)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${riskBadgeColor(report.riskClassification)}`}>
                    {report.riskClassification}
                  </span>
                  <span className="text-xs text-muted-foreground">{report.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No impact assessments generated yet. Click &ldquo;Generate AIA&rdquo; to create one.</p>
        )}
      </div>
    </div>
  );
}
