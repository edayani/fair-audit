import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Small uppercase label above the title (e.g., module name) */
  eyebrow?: string;
  /** Legal authority this module operationalizes, shown as a subtle citation chip */
  authority?: string;
  back?: { href: string; label: string };
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, eyebrow, authority, back, children, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-6 sm:mb-8", className)}>
      {back && (
        <Link
          href={back.href}
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {(eyebrow || authority) && (
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {eyebrow && (
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brass">{eyebrow}</span>
              )}
              {authority && (
                <span className="rounded-md border bg-card px-1.5 py-0.5 font-serif text-[11px] italic text-muted-foreground">
                  {authority}
                </span>
              )}
            </div>
          )}
          <h1 className="font-serif text-[28px] font-semibold leading-tight tracking-tight text-balance sm:text-[32px]">{title}</h1>
          {description && <p className="mt-1.5 max-w-3xl text-[15px] leading-relaxed text-muted-foreground text-pretty">{description}</p>}
        </div>
        {children && <div className="flex flex-wrap items-center gap-2 sm:justify-end">{children}</div>}
      </div>
    </div>
  );
}
