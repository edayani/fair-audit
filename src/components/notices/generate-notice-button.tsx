"use client";
// Spec §4.J — Adverse-action notice generator
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2 } from "lucide-react";
import { generateNotice } from "@/actions/notice";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";

type NoticeType = "ADVERSE_ACTION" | "PRE_ADVERSE" | "CONDITIONAL_APPROVAL" | "CORRECTION" | "REQUEST_INFO";

export function GenerateNoticeButton({ applicationId, defaultType = "ADVERSE_ACTION" }: { applicationId: string; defaultType?: NoticeType }) {
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<NoticeType>(defaultType);
  const router = useRouter();

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateNotice(applicationId, type);
      if (result.success) {
        toast.success("Notice generated and preserved to the evidence vault");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to generate notice");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={type} onChange={(e) => setType(e.target.value as NoticeType)} className="w-auto" aria-label="Notice type">
        <option value="ADVERSE_ACTION">Adverse action</option>
        <option value="PRE_ADVERSE">Pre-adverse action</option>
        <option value="CONDITIONAL_APPROVAL">Conditional approval</option>
        <option value="CORRECTION">Corrected determination</option>
        <option value="REQUEST_INFO">Request for information</option>
      </Select>
      <Button onClick={handleGenerate} loading={isPending}>
        {!isPending && <FilePlus2 />}
        Generate notice
      </Button>
    </div>
  );
}
