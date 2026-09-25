"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2 } from "lucide-react";
import { generateAIA } from "@/actions/ai-governance";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";

export function AIAGenerator() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateAIA();
      if (result.success) {
        toast.success("Algorithmic impact assessment generated and preserved");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to generate assessment");
      }
    });
  }

  return (
    <Button onClick={handleGenerate} loading={isPending} size="sm">
      {!isPending && <FilePlus2 />}
      Generate assessment
    </Button>
  );
}
