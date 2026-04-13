import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Shield, BarChart3, FileCheck, Scale, Brain, Lock, Eye, GitBranch, Fingerprint, Network } from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">FairAudit</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Sign In
            </Link>
            <Link href="/sign-up" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground mb-6">
            <Brain className="h-4 w-4" />
            Powered by Explainable AI &middot; NIST AI RMF Aligned
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
            Fair Housing AI Auditor
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
            An end-to-end algorithmic accountability platform that makes every tenant-screening
            decision answerable to five questions: Was the data accurate? Was the criterion relevant?
            Was the rule applied consistently? Did it create discriminatory effects?
            Could the applicant challenge and correct it?
          </p>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Built on disparate impact analytics, burden-shifting frameworks, and
            human-in-the-loop oversight to operationalize HUD guidance, the Fair Credit
            Reporting Act, and emerging AI governance mandates.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up" className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-lg font-medium text-primary-foreground hover:bg-primary/90">
              Start Your Audit
            </Link>
            <Link href="/sign-in" className="inline-flex items-center justify-center rounded-md border px-8 py-3 text-lg font-medium hover:bg-muted">
              View Demo
            </Link>
          </div>
        </div>

        {/* Trust bar */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-16">
          <span>NIST AI RMF</span>
          <span className="hidden sm:inline">&middot;</span>
          <span>HUD Disparate Impact Rule</span>
          <span className="hidden sm:inline">&middot;</span>
          <span>FCRA &sect;604(b)</span>
          <span className="hidden sm:inline">&middot;</span>
          <span>EU AI Act Risk-Tier</span>
          <span className="hidden sm:inline">&middot;</span>
          <span>CA FEHA</span>
        </div>

        {/* Core features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {[
            { icon: Shield, title: "Adaptive Policy Engine", desc: "Define transparent, auditable screening criteria with jurisdiction-aware rule overlays and configurable risk tolerances" },
            { icon: BarChart3, title: "Disparate Impact Analytics", desc: "Real-time civil-rights monitoring with four-fifths rule detection, statistical significance testing, and protected-class breakdowns" },
            { icon: FileCheck, title: "Immutable Audit Trail", desc: "Tamper-proof evidence vault with cryptographic integrity checks logging every decision, override, and remediation action" },
            { icon: Scale, title: "Regulatory Compliance", desc: "Multi-jurisdiction coverage spanning Federal FHA, California FEHA, FCRA adverse-action notices, and local fair-chance ordinances" },
          ].map((feature) => (
            <div key={feature.title} className="rounded-lg border bg-card p-6">
              <feature.icon className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* AI & Legal differentiators */}
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Responsible AI Meets Legal Precision
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Purpose-built for the intersection of algorithmic decision-making and civil-rights law.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {[
            { icon: Brain, title: "Explainable AI (XAI)", desc: "Model-agnostic interpretability layer generates plain-language rationales for every accept/deny recommendation, satisfying right-to-explanation mandates." },
            { icon: Eye, title: "Human-in-the-Loop Review", desc: "Mandatory escalation workflows ensure no high-stakes decision is fully automated, embedding proportionality and due-process safeguards at every stage." },
            { icon: GitBranch, title: "Burden-Shifting Analysis", desc: "Automates HUD's three-prong disparate impact test: prima facie case, business necessity justification, and less-discriminatory alternative evaluation." },
            { icon: Fingerprint, title: "Individualized Assessment", desc: "Implements the four-factor HUD criminal-history framework: nature of offense, time elapsed, rehabilitative evidence, and nexus to tenancy risk." },
            { icon: Lock, title: "Algorithmic Impact Assessment", desc: "NIST AI Risk Management Framework-aligned scorecards covering bias, transparency, robustness, accountability, and data governance." },
            { icon: Network, title: "AI Governance Dashboard", desc: "Centralized model-card registry, compliance scorecards, and audit-readiness indicators aligned with emerging federal and state AI governance mandates." },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border bg-card p-6 hover:shadow-md transition-shadow">
              <item.icon className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="rounded-xl border bg-card p-10 text-center">
          <h2 className="text-2xl font-bold mb-3">
            Operationalize Algorithmic Accountability
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6">
            From adverse-action notices to disparate impact regression testing,
            FairAudit transforms compliance obligations into auditable, defensible workflows.
          </p>
          <Link href="/sign-up" className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-lg font-medium text-primary-foreground hover:bg-primary/90">
            Get Started Free
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>FairAudit</span>
          </div>
          <p>Algorithmic Accountability &middot; Civil-Rights Compliance &middot; AI Governance</p>
        </div>
      </footer>
    </div>
  );
}
