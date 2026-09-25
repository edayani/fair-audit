import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "warning" | "danger" | "info";

const toneRing: Record<Tone, string> = {
  default: "bg-secondary text-secondary-foreground",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  danger: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
  info: "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
};

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: Tone;
  href?: string;
  className?: string;
}

export function StatCard({ label, value, hint, icon: Icon, tone = "default", href, className }: StatCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <div className={cn("flex size-8 items-center justify-center rounded-lg", toneRing[tone])}>
            <Icon className="size-4" />
          </div>
        )}
      </div>
      <p className="mt-2 font-serif text-3xl font-semibold tracking-tight tabular">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {href && (
        <ArrowUpRight className="absolute bottom-4 right-4 size-4 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground" />
      )}
    </>
  );

  const classes = cn(
    "group relative rounded-xl border bg-card p-4 shadow-[0_1px_2px_rgb(15_23_42/0.04)] sm:p-5",
    href && "transition-all hover:-translate-y-px hover:border-primary/25 hover:shadow-md",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {body}
      </Link>
    );
  }
  return <div className={classes}>{body}</div>;
}

/** Horizontal meter used for rates, scores, and confidence values (0–1). */
export function Meter({
  value,
  tone = "default",
  className,
  label,
}: {
  value: number;
  tone?: Tone;
  className?: string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const bar: Record<Tone, string> = {
    default: "bg-primary",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    info: "bg-sky-500",
  };
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={label}
    >
      <div className={cn("h-full rounded-full transition-[width]", bar[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}
