import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <FileQuestion className="size-5" />
        </div>
        <h2 className="font-serif text-2xl font-semibold">Record not found</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This record doesn&apos;t exist in the current organization&apos;s workspace. It may belong to another
          organization, or it was replaced when sample data was reloaded.
        </p>
        <Link href="/dashboard" className={buttonVariants({ className: "mt-6" })}>
          Back to overview
        </Link>
      </div>
    </div>
  );
}
