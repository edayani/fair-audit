import { ClipboardCheck, ShieldAlert, UserCheck } from "lucide-react";
import { getQueueStats, getReviewQueue } from "@/actions/review";
import { getAuthContext } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { ReviewCard } from "@/components/review/review-card";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";

export const metadata = { title: "Review queue" };

export default async function ReviewQueuePage() {
  const [queue, stats, ctx] = await Promise.all([getReviewQueue(), getQueueStats(), getAuthContext()]);

  return (
    <div>
      <PageHeader
        eyebrow="Adjudication"
        authority="Spec §4.H · human-in-the-loop"
        title="Review queue"
        description="Determinations the engine could not issue on its own. A qualified reviewer decides each one on the record — oldest first."
      />

      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Awaiting review" value={stats.pendingReview} icon={ClipboardCheck} tone={stats.pendingReview > 0 ? "info" : "success"} />
        <StatCard label="Reviews recorded" value={stats.reviewed} icon={UserCheck} />
        <StatCard label="Overrides" value={stats.overridden} icon={ShieldAlert} tone={stats.overridden > 0 ? "warning" : "default"} />
      </div>

      {queue.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="The queue is clear" description="Every determination has been reviewed. New cases appear here when the engine routes them for human judgment." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {queue.map((item) => (
            <ReviewCard key={item.id} decision={item} hasAssessment={!!item.individualizedAssessment} canAct={ctx.accessTier === "FULL"} />
          ))}
        </div>
      )}
    </div>
  );
}
