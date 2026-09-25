import { cn } from "@/lib/utils";

/**
 * FairAudit mark — a civic pediment over three columns: housing held to the
 * standard of the courthouse.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path d="M16 6.5 25 11.5H7L16 6.5Z" fill="var(--logo-accent, #d6b25e)" />
      <rect x="9" y="13.5" width="2.6" height="8.5" rx="0.6" fill="white" />
      <rect x="14.7" y="13.5" width="2.6" height="8.5" rx="0.6" fill="white" />
      <rect x="20.4" y="13.5" width="2.6" height="8.5" rx="0.6" fill="white" />
      <rect x="7" y="23.5" width="18" height="2.2" rx="0.6" fill="white" />
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
  tone = "default",
}: {
  className?: string;
  markClassName?: string;
  tone?: "default" | "light";
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={cn(tone === "light" ? "text-white/10" : "text-ink", markClassName)} />
      <span
        className={cn(
          "font-serif text-[19px] font-semibold tracking-tight",
          tone === "light" ? "text-white" : "text-foreground"
        )}
      >
        FairAudit
      </span>
    </span>
  );
}
