"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Send } from "lucide-react";
import { markNoticeSent } from "@/actions/notice";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { toast } from "@/lib/toast";
import type { NoticeContent } from "./notice-document";

export function NoticeDownloadButton({ content, fileName }: { content: NoticeContent; fileName: string }) {
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    setBusy(true);
    try {
      const [{ pdf }, { NoticePDFDocument }] = await Promise.all([import("@react-pdf/renderer"), import("./notice-document")]);
      const blob = await pdf(<NoticePDFDocument content={content} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (error) {
      console.error(error);
      toast.error("The PDF could not be generated. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} loading={busy}>
      {!busy && <Download />}
      PDF
    </Button>
  );
}

export function MarkNoticeSent({ noticeId }: { noticeId: string }) {
  const [method, setMethod] = useState("email");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      const result = await markNoticeSent(noticeId, method);
      if (result.success) {
        toast.success("Delivery recorded to the audit trail");
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not record delivery");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={method} onChange={(e) => setMethod(e.target.value)} className="h-8 w-auto text-xs" aria-label="Delivery method">
        <option value="email">Email</option>
        <option value="postal">First-class mail</option>
        <option value="in_person">In person</option>
        <option value="portal">Applicant portal</option>
      </Select>
      <Button size="sm" onClick={handleClick} loading={isPending}>
        {!isPending && <Send />}
        Mark delivered
      </Button>
    </div>
  );
}
