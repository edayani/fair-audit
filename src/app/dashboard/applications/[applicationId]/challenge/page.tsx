import { getChallenges } from "@/actions/challenge";
import { PageHeader } from "@/components/shared/page-header";
import { ChallengeForm } from "@/components/challenge/challenge-form";
import { formatDate, humanize } from "@/lib/utils";
import { MessageSquare, CheckCircle, XCircle, Clock } from "lucide-react";

export default async function ChallengePage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  const challenges = await getChallenges(applicationId);

  const statusIcon = (status: string) => {
    switch (status) {
      case "RESOLVED_ACCEPTED": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "RESOLVED_REJECTED": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div>
      <PageHeader title="Challenges" description="Applicant dispute, mitigation, and accommodation portal (Spec §4.I)" />

      {challenges.length > 0 && (
        <div className="space-y-3 mb-8">
          {challenges.map((c) => (
            <div key={c.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {statusIcon(c.status)}
                  <span className="font-medium text-sm">{humanize(c.type)} Challenge</span>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(c.submittedAt)}</span>
              </div>
              <p className="text-sm">{c.description}</p>
              {c.resolution && <p className="text-sm text-muted-foreground mt-2">Resolution: {c.resolution}</p>}
              {c.documents.length > 0 && <p className="text-xs text-muted-foreground mt-1">{c.documents.length} supporting document(s)</p>}
            </div>
          ))}
        </div>
      )}

      <ChallengeForm applicationId={applicationId} />
    </div>
  );
}
