import { notFound } from "next/navigation";
import { CheckCircle2, FileText, Mail } from "lucide-react";
import { getApplication } from "@/actions/application";
import { GenerateNoticeButton } from "@/components/notices/generate-notice-button";
import { MarkNoticeSent, NoticeDownloadButton } from "@/components/notices/notice-actions";
import type { NoticeContent } from "@/components/notices/notice-document";
import { PreviewGate } from "@/components/shared/preview-gate";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTime, humanize } from "@/lib/utils";

export const metadata = { title: "Notices" };

export default async function NoticePage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  const app = await getApplication(applicationId);
  if (!app) notFound();

  const outcome = app.decision?.outcome;
  const needsNotice = (outcome === "DENIED" || outcome === "CONDITIONAL") && app.notices.length === 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Adverse-action notices</h2>
          <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
            FCRA § 615(a) requires notice of any adverse action based on a consumer report, including the principal reasons,
            the consumer reporting agency, and the applicant&apos;s right to a free report and to dispute. Each notice is
            hashed and preserved to the evidence vault.
          </p>
          {needsNotice && (
            <Badge tone="warning" className="mt-3">
              A notice is required for this {humanize(outcome!).toLowerCase()} determination
            </Badge>
          )}
        </div>
        <PreviewGate label="Full access required">
          <GenerateNoticeButton applicationId={applicationId} defaultType={outcome === "CONDITIONAL" ? "CONDITIONAL_APPROVAL" : "ADVERSE_ACTION"} />
        </PreviewGate>
      </div>

      {app.notices.length === 0 ? (
        <EmptyState icon={FileText} title="No notices generated" description="Generate a notice once a determination has been issued." compact />
      ) : (
        <div className="space-y-3">
          {app.notices.map((notice) => {
            const content = notice.content as unknown as NoticeContent;
            return (
              <Card key={notice.id} className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <FileText className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{humanize(notice.type)} notice</p>
                      <p className="text-xs text-muted-foreground">
                        Generated {formatDateTime(notice.generatedAt)}
                        {notice.craName ? ` · CRA: ${notice.craName}` : ""}
                      </p>
                      <div className="mt-2">
                        {notice.sentAt ? (
                          <Badge tone="success">
                            <CheckCircle2 />
                            Delivered {formatDate(notice.sentAt)}
                            {notice.sentMethod ? ` via ${humanize(notice.sentMethod).toLowerCase()}` : ""}
                          </Badge>
                        ) : (
                          <Badge tone="warning">
                            <Mail />
                            Not yet delivered
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <NoticeDownloadButton
                      content={{ ...content, noticeType: content.noticeType ?? notice.type }}
                      fileName={`${notice.type.toLowerCase().replace(/_/g, "-")}-${app.applicant.lastName.toLowerCase()}.pdf`}
                    />
                    {!notice.sentAt && (
                      <PreviewGate label="Full access required">
                        <MarkNoticeSent noticeId={notice.id} />
                      </PreviewGate>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
