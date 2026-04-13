import { getReviewQueue, getQueueStats } from "@/actions/review";
import { PageHeader } from "@/components/shared/page-header";
import { ReviewCard } from "@/components/review/review-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ClipboardCheck, UserCheck, ArrowRight } from "lucide-react";

export default async function ReviewQueuePage() {
  const [queue, stats] = await Promise.all([getReviewQueue(), getQueueStats()]);

  return (
    <div>
      <PageHeader title="Review Queue" description="Human review and override workflow (Spec §4.H)" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold">{stats.pendingReview}</p></div>
        <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">Reviewed</p><p className="text-2xl font-bold">{stats.reviewed}</p></div>
        <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">Overridden</p><p className="text-2xl font-bold">{stats.overridden}</p></div>
      </div>

      {queue.length === 0 ? (
        <EmptyState title="Queue is empty" description="No applications are pending human review." />
      ) : (
        <div className="space-y-4">
          {queue.map((item) => (
            <ReviewCard key={item.id} decision={item} hasAssessment={!!item.individualizedAssessment} />
          ))}
        </div>
      )}
    </div>
  );
}
