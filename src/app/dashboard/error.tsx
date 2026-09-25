"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const noOrg = error.message?.includes("No organization selected");

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300">
          <TriangleAlert className="size-5" />
        </div>
        <h2 className="font-serif text-2xl font-semibold">
          {noOrg ? "Select an organization to continue" : "This page couldn't be loaded"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {noOrg
            ? "Use the organization switcher in the top bar to choose or create a workspace."
            : "Something went wrong while retrieving this record. Nothing was changed. You can retry, or return to the overview."}
        </p>
        {error.digest && <p className="mt-3 font-mono text-[11px] text-muted-foreground">Reference: {error.digest}</p>}
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={() => unstable_retry()}>
            <RotateCcw />
            Try again
          </Button>
          <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
            Back to overview
          </Link>
        </div>
      </div>
    </div>
  );
}
