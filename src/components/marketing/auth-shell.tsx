import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const POINTS = [
  "Every adverse determination explained with plain-language reason codes",
  "Individualized assessment and human review before any denial",
  "FCRA-compliant notices and an append-only evidentiary record",
];

export function AuthShell({ children, mode }: { children: React.ReactNode; mode: "sign-in" | "sign-up" }) {
  return (
    <div className="grid min-h-screen bg-white text-[#161d2e] lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col">
        <div className="bg-grid-light absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_70%)]" aria-hidden />
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-[radial-gradient(circle,rgba(214,178,94,0.22),transparent_65%)]" aria-hidden />
        <Link href="/" className="relative" aria-label="FairAudit home">
          <Logo tone="light" />
        </Link>
        <div className="relative mt-auto max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brass">Fair housing compliance</p>
          <h2 className="mt-4 font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-balance">
            Due process for every applicant. A defensible record for every decision.
          </h2>
          <ul className="mt-8 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex gap-3 text-[15px] leading-relaxed text-white/80">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brass" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative mt-12 text-xs text-white/40">Built for affordable, supportive, and publicly assisted housing operators.</p>
      </aside>

      <main className="flex flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between lg:justify-end">
          <Link href="/" className="lg:hidden" aria-label="FairAudit home">
            <Logo />
          </Link>
          <p className="text-sm text-[#5b6478]">
            {mode === "sign-in" ? "New to FairAudit? " : "Already have an account? "}
            <Link href={mode === "sign-in" ? "/sign-up" : "/sign-in"} className="font-medium text-[#1f3563] hover:underline">
              {mode === "sign-in" ? "Create an account" : "Sign in"}
            </Link>
          </p>
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>
        <p className="text-center text-xs text-[#8a92a3]">
          By continuing you agree to the{" "}
          <Link href="/terms" className="underline underline-offset-2 hover:text-[#161d2e]">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-[#161d2e]">
            Privacy Policy
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
