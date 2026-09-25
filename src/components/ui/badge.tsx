import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, humanize } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        neutral: "border-border bg-muted text-muted-foreground",
        brand: "border-primary/20 bg-primary/8 text-primary dark:bg-primary/15",
        success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300",
        warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-300",
        danger: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/50 dark:text-rose-300",
        info: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/50 dark:text-sky-300",
        violet: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800/60 dark:bg-violet-950/50 dark:text-violet-300",
        outline: "border-border bg-transparent text-foreground",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

export function Badge({
  className,
  tone,
  dot,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants> & { dot?: boolean }) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden />}
      {children}
    </span>
  );
}

const OUTCOME_TONES: Record<string, BadgeTone> = {
  APPROVED: "success",
  DENIED: "danger",
  CONDITIONAL: "warning",
  PENDING_REVIEW: "info",
};

const OUTCOME_LABELS: Record<string, string> = {
  APPROVED: "Approved",
  DENIED: "Denied",
  CONDITIONAL: "Conditional",
  PENDING_REVIEW: "Pending review",
};

export function OutcomeBadge({ outcome, className }: { outcome: string | null | undefined; className?: string }) {
  if (!outcome) return <Badge className={className}>Undecided</Badge>;
  return (
    <Badge tone={OUTCOME_TONES[outcome] ?? "neutral"} dot className={className}>
      {OUTCOME_LABELS[outcome] ?? humanize(outcome)}
    </Badge>
  );
}

const SEVERITY_TONES: Record<string, BadgeTone> = {
  LOW: "info",
  MEDIUM: "warning",
  HIGH: "danger",
  CRITICAL: "danger",
  UNACCEPTABLE: "danger",
};

export function SeverityBadge({ severity, className }: { severity: string; className?: string }) {
  return (
    <Badge tone={SEVERITY_TONES[severity] ?? "neutral"} className={cn("uppercase tracking-wide text-[10px]", className)}>
      {severity}
    </Badge>
  );
}

const STATUS_TONES: Record<string, BadgeTone> = {
  PENDING: "neutral",
  IN_REVIEW: "info",
  DECIDED: "brand",
  WITHDRAWN: "neutral",
  SUBMITTED: "info",
  UNDER_REVIEW: "warning",
  RESOLVED_ACCEPTED: "success",
  RESOLVED_REJECTED: "danger",
  GRANTED: "success",
  NEW: "danger",
  ACKNOWLEDGED: "warning",
  INVESTIGATING: "warning",
  RESOLVED: "success",
  DRAFT: "neutral",
  FINAL: "success",
  ISSUED: "brand",
  APPROVED: "success",
  DENIED: "danger",
};

export function StatusBadge({ status, label, className }: { status: string; label?: string; className?: string }) {
  return (
    <Badge tone={STATUS_TONES[status] ?? "neutral"} className={className}>
      {label ?? humanize(status)}
    </Badge>
  );
}
