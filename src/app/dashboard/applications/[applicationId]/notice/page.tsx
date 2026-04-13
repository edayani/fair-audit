import { getNotices } from "@/actions/notice";
import { PageHeader } from "@/components/shared/page-header";
import { GenerateNoticeButton } from "@/components/notices/generate-notice-button";
import { NoticePDFDownloadButton } from "@/components/notices/notice-pdf";
import { formatDate, humanize } from "@/lib/utils";
import { FileOutput, Mail, Check } from "lucide-react";

interface NoticeContent {
  applicantName: string;
  applicantEmail?: string | null;
  propertyName: string;
  propertyAddress: string;
  decisionDate?: string;
  outcome?: string;
  reasonCodes: Array<{ code: string; category: string; shortText: string; detailedText: string }>;
  applicantRights: {
    freeReportRight: string;
    disputeRight: string;
    reportingAgencyNotice: string;
  };
  generatedAt: string;
  noticeType: string;
}

export default async function NoticePage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  const notices = await getNotices(applicationId);

  return (
    <div>
      <PageHeader title="Notices" description="Adverse-action and compliance notices (Spec §4.J)">
        <GenerateNoticeButton applicationId={applicationId} />
      </PageHeader>

      {notices.length === 0 ? (
        <p className="text-muted-foreground">No notices generated yet.</p>
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => (
            <div key={notice.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileOutput className="h-5 w-5 text-primary" />
                  <span className="font-medium">{humanize(notice.type)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <NoticePDFDownloadButton notice={notice.content as unknown as NoticeContent} />
                  {notice.sentAt ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600"><Check className="h-3 w-3" /> Sent {formatDate(notice.sentAt)}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" /> Not sent</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Generated: {formatDate(notice.generatedAt)}</p>
              {notice.craName && <p className="text-xs text-muted-foreground mt-1">CRA: {notice.craName}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
