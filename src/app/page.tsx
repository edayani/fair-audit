import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Building2,
  Eye,
  FileCheck,
  Fingerprint,
  GitBranch,
  Globe2,
  Layers3,
  Lock,
  Scale,
  ScrollText,
  Shield,
  ShieldCheck,
  Sparkles,
  Users2,
  Workflow,
} from "lucide-react";

const audienceBands = [
  "Portfolio Operators",
  "Affordable Housing Teams",
  "AI Governance Committees",
  "Enterprise Compliance",
  "Model Risk Teams",
  "Asset Managers",
  "Screening Policy Leads",
];

const heroHighlights = [
  {
    icon: ShieldCheck,
    title: "Boardroom confidence",
    description: "A defensible audit trail built for counsel, regulators, executive reporting, and formal governance review.",
  },
  {
    icon: Users2,
    title: "Role-aware workflows",
    description: "Separate operators, reviewers, and administrators through workflow orchestration and cleaner approval controls.",
  },
  {
    icon: ScrollText,
    title: "Evidence on demand",
    description: "Turn day-to-day screening operations into audit-ready documentation, AI assurance records, and compliance artifacts.",
  },
];

const commandSurfaces = [
  {
    icon: BarChart3,
    eyebrow: "Executive Command Center",
    title: "A portfolio-level view of exposure, review queues, policy health, and model-risk posture.",
    description:
      "Give leadership one place to understand regulatory exposure, accountability controls, algorithmic governance posture, and operational discipline across screening activity.",
    details: ["Cross-property visibility", "Disparity monitoring", "Executive escalation snapshots"],
    accent: "from-slate-950 via-slate-900 to-slate-800 text-white",
  },
  {
    icon: Layers3,
    eyebrow: "Policy Studio",
    title: "Jurisdiction-aware policy orchestration with human-readable logic and cleaner governance.",
    description:
      "Move beyond static checklists with configurable criteria, review gates, exception handling, and documented controls that legal, risk, and operations teams can actually inspect.",
    details: ["Versioned screening criteria", "Rule overlays by jurisdiction", "Human review checkpoints"],
    accent: "from-white via-slate-50 to-slate-100 text-slate-950",
  },
  {
    icon: FileCheck,
    eyebrow: "Evidence Vault",
    title: "An audit package built while the work is happening, not reconstructed after the fact.",
    description:
      "Capture overrides, applicant challenges, fairness analysis, adverse-action support, and supporting documents in the same operating layer.",
    details: ["Immutable activity history", "Decision-linked documents", "Remediation evidence"],
    accent: "from-[#eef4ff] via-white to-[#f6f8fb] text-slate-950",
  },
];

const enterprisePillars = [
  {
    icon: Globe2,
    title: "Multi-organization ready",
    description: "Structured for multi-tenant teams operating multiple properties, portfolios, stakeholders, and governance lanes.",
  },
  {
    icon: GitBranch,
    title: "Governance built into flow",
    description: "Every review, override, and escalation becomes part of the workflow fabric instead of a disconnected side note.",
  },
  {
    icon: Brain,
    title: "Explainability by default",
    description: "Make AI recommendations legible enough for internal reviewers, compliance teams, and external scrutiny.",
  },
  {
    icon: Lock,
    title: "Risk controls, not just analytics",
    description: "Pair fairness monitoring with policy enforcement, AI assurance, evidence retention, and approval discipline.",
  },
];

const operatingModel = [
  {
    step: "01",
    title: "Set the screening standard",
    description: "Configure policy logic, jurisdiction overlays, review thresholds, and compliance-by-design controls with a structure teams can govern over time.",
  },
  {
    step: "02",
    title: "Route high-stakes decisions",
    description: "Send the right applications to human review with context around relevance, consistency, discriminatory effect, and adverse-action defensibility.",
  },
  {
    step: "03",
    title: "Retain the evidence trail",
    description: "Preserve the analysis, supporting records, operator actions, and governance metadata needed for executive reporting or audit response.",
  },
];

const governanceSignals = [
  { label: "Fair housing rule overlays", value: "Multi-jurisdiction compliance orchestration", icon: Scale },
  { label: "Decision accountability model", value: "Five-question review discipline", icon: Eye },
  { label: "Assessment layer", value: "Explainable AI + human review context", icon: Fingerprint },
  { label: "Operating footprint", value: "Built for teams, portfolios, counsel, and risk", icon: Building2 },
];

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(60,88,132,0.16),transparent_32%),linear-gradient(180deg,#f7f9fc_0%,#eef3f8_42%,#ffffff_100%)] text-slate-950">
      <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(241,245,249,0.5),rgba(212,224,239,0.45))]" />
      <div className="absolute left-1/2 top-24 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-[rgba(44,77,119,0.22)] blur-3xl" />
      <div className="absolute right-0 top-60 -z-10 h-80 w-80 rounded-full bg-[rgba(128,152,186,0.18)] blur-3xl" />

      <header className="sticky top-0 z-50 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_16px_40px_rgba(15,23,42,0.2)]">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">FairAudit</div>
              <div className="text-sm text-slate-600">Fair housing governance for modern screening teams</div>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
            <a href="#platform" className="transition-colors hover:text-slate-950">Platform</a>
            <a href="#governance" className="transition-colors hover:text-slate-950">Governance</a>
            <a href="#operators" className="transition-colors hover:text-slate-950">Operating Model</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 sm:inline-flex">
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white shadow-[0_16px_32px_rgba(15,23,42,0.18)] transition-transform hover:-translate-y-0.5"
            >
              Request Access
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-4 pb-18 pt-10 sm:px-6 lg:px-8 lg:pb-24 lg:pt-16">
          <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div className="flex flex-col items-center text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-600 shadow-sm backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                Enterprise-grade AI governance and fair housing controls
              </div>

              <div className="mt-7 max-w-3xl">
                <p className="text-sm font-medium uppercase tracking-[0.26em] text-slate-500">
                  Built for organizations running complex tenant-screening, compliance, and model-governance programs
                </p>
                <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-[0.95] font-semibold tracking-[-0.05em] text-slate-950 sm:text-6xl lg:text-7xl">
                  The control layer that makes high-stakes screening decisions feel
                  <span className="block text-slate-600">institutional, governed, and defensible.</span>
                </h1>
                <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                  FairAudit turns fair housing compliance into an operating system for policy orchestration,
                  explainable AI review, workflow automation, fairness analysis, and audit-ready evidence
                  so leaders can scale with sharper confidence.
                </p>
              </div>

              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-7 py-3.5 text-base font-medium text-white shadow-[0_22px_40px_rgba(15,23,42,0.18)] transition-transform hover:-translate-y-0.5"
                >
                  Launch the Platform
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/85 px-7 py-3.5 text-base font-medium text-slate-700 shadow-sm transition-colors hover:bg-white"
                >
                  View Demo Workspace
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {heroHighlights.map((item) => (
                  <div key={item.title} className="rounded-3xl border border-white/70 bg-white/70 p-5 text-center shadow-[0_20px_50px_rgba(15,23,42,0.06)] backdrop-blur">
                    <item.icon className="mx-auto h-5 w-5 text-slate-950" />
                    <h2 className="mt-4 text-sm font-semibold text-slate-950">{item.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-wrap justify-center gap-3 text-sm text-slate-600">
                {audienceBands.map((band) => (
                  <div key={band} className="rounded-full border border-slate-300/70 bg-white/75 px-4 py-2 shadow-sm backdrop-blur">
                    {band}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[2rem] bg-[radial-gradient(circle_at_top,rgba(85,114,156,0.18),transparent_55%)] blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-slate-950 p-6 text-center text-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]">
                <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),transparent_42%,rgba(90,111,146,0.18))]" />
                <div className="relative">
                  <div className="flex flex-col items-center gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Illustrative platform snapshot</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight">Operations Control Center</h2>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      Live governance layer
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Active properties</p>
                      <p className="mt-3 text-3xl font-semibold">128</p>
                      <p className="mt-2 text-sm text-slate-300">Governed under a shared policy standard</p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Review queue</p>
                      <p className="mt-3 text-3xl font-semibold">17</p>
                      <p className="mt-2 text-sm text-slate-300">Escalated decisions awaiting human review</p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Jurisdictions active</p>
                      <p className="mt-3 text-3xl font-semibold">6</p>
                      <p className="mt-2 text-sm text-slate-300">Overlay-aware policy and notice logic</p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Open risk alerts</p>
                      <p className="mt-3 text-3xl font-semibold">2</p>
                      <p className="mt-2 text-sm text-slate-300">Flagged for counsel and compliance leadership</p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/6 p-5">
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Executive briefing</p>
                        <p className="mt-2 text-lg font-medium">Policy posture remains stable across the portfolio and governance stack.</p>
                      </div>
                      <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-300">
                        Audit-ready
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-white/5 p-4">
                        <p className="text-xs text-slate-400">Decision consistency</p>
                        <p className="mt-2 text-lg font-semibold">Structured review path</p>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-4">
                        <p className="text-xs text-slate-400">Applicant challenge flow</p>
                        <p className="mt-2 text-lg font-semibold">Tracked and retained</p>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-4">
                        <p className="text-xs text-slate-400">Fairness oversight</p>
                        <p className="mt-2 text-lg font-semibold">Continuous monitoring</p>
                      </div>
                    </div>
                  </div>

                  <p className="mt-5 text-xs text-slate-400">
                    Product visuals shown as illustrative examples of the operating experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200/70 bg-white/65 py-6 backdrop-blur" id="platform">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-4 px-4 text-center sm:px-6 lg:px-8">
            <span className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-500">Built for</span>
            {audienceBands.map((band) => (
              <span key={band} className="text-sm font-medium text-slate-700">
                {band}
              </span>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-500">Platform surface</p>
            <h2 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
              Designed to feel less like a checklist and more like a serious control environment.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Every section of the product is meant to signal operational maturity: decision controls,
              review discipline, retained evidence, AI assurance layers, and a leadership-level picture of exposure.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {commandSurfaces.map((surface, index) => (
              <div
                key={surface.title}
                className={`relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-gradient-to-br p-7 shadow-[0_25px_70px_rgba(15,23,42,0.08)] ${surface.accent} ${
                  index === 0 ? "lg:col-span-2" : ""
                }`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_38%)]" />
                <div className="relative text-center">
                  <surface.icon className={`mx-auto h-6 w-6 ${index === 0 ? "text-slate-200" : "text-slate-700"}`} />
                  <p className={`mt-6 text-xs font-semibold uppercase tracking-[0.28em] ${index === 0 ? "text-slate-300" : "text-slate-500"}`}>
                    {surface.eyebrow}
                  </p>
                  <h3 className="mx-auto mt-3 max-w-2xl text-2xl font-semibold tracking-tight">{surface.title}</h3>
                  <p className={`mx-auto mt-4 max-w-2xl text-sm leading-7 ${index === 0 ? "text-slate-300" : "text-slate-600"}`}>
                    {surface.description}
                  </p>

                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {surface.details.map((detail) => (
                      <div
                        key={detail}
                        className={`rounded-2xl border px-4 py-4 text-sm ${
                          index === 0
                            ? "border-white/10 bg-white/6 text-slate-100"
                            : "border-slate-200/70 bg-white/70 text-slate-700"
                        }`}
                      >
                        {detail}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-14" id="governance">
          <div className="rounded-[2rem] border border-slate-200/70 bg-white/80 p-8 shadow-[0_25px_70px_rgba(15,23,42,0.06)] backdrop-blur sm:p-10">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-500">Governance posture</p>
                <h2 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                  The product language should feel credible to operators, counsel, and leadership alike.
                </h2>
                <p className="mt-5 text-lg leading-8 text-slate-600">
                  FairAudit is designed around real organizational tension: faster throughput, tighter controls,
                  stronger model governance, and clearer evidence when a decision gets challenged.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {enterprisePillars.map((pillar) => (
                  <div key={pillar.title} className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-6 text-center">
                    <pillar.icon className="mx-auto h-5 w-5 text-slate-950" />
                    <h3 className="mt-4 text-lg font-semibold text-slate-950">{pillar.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{pillar.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24" id="operators">
          <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-500">Operating model</p>
              <h2 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
                A cleaner, more enterprise-ready narrative from intake to final decision.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                The landing page should communicate that this is a serious platform for organizations that
                need structure, not another lightweight compliance dashboard.
              </p>
            </div>

            <div className="space-y-4">
              {operatingModel.map((item) => (
                <div key={item.step} className="rounded-[1.75rem] border border-slate-200/70 bg-white/80 p-6 text-center shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                        {item.step}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-slate-950">{item.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
                      </div>
                    </div>
                    <Workflow className="h-5 w-5 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-24">
          <div className="rounded-[2rem] border border-slate-200/70 bg-slate-950 p-8 text-white shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:p-10">
            <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-400">Signal quality</p>
                <h2 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                  The visual language now tells a stronger story about scale and seriousness.
                </h2>
                <p className="mt-5 text-lg leading-8 text-slate-300">
                  Premium spacing, richer surfaces, sharper hierarchy, and a stronger governance narrative
                  help the site feel closer to an enterprise AI platform than an early-stage prototype.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-slate-200">Executive-ready reporting</div>
                  <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-slate-200">Cross-functional workflow automation</div>
                  <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-slate-200">Audit posture by design</div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {governanceSignals.map((signal) => (
                  <div key={signal.label} className="rounded-3xl border border-white/10 bg-white/6 p-5 text-center">
                    <signal.icon className="mx-auto h-5 w-5 text-slate-200" />
                    <p className="mt-4 text-sm font-medium text-slate-300">{signal.label}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{signal.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2.25rem] border border-slate-200/70 bg-[linear-gradient(135deg,#ffffff_0%,#eef3f9_45%,#dfe7f1_100%)] p-8 shadow-[0_25px_70px_rgba(15,23,42,0.08)] sm:p-10 lg:p-14">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="text-center lg:text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-500">Final call to action</p>
                <h2 className="mx-auto mt-4 max-w-3xl font-serif text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
                  Present FairAudit like a platform built for organizations with real operational exposure.
                </h2>
                <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                  From adverse-action documentation to fairness monitoring, policy orchestration, and evidence retention,
                  the landing page now frames the product as a serious control environment for modern housing organizations.
                </p>
              </div>

              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:flex-col">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-7 py-3.5 text-base font-medium text-white shadow-[0_20px_40px_rgba(15,23,42,0.16)]"
                >
                  Start Your Audit
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white/85 px-7 py-3.5 text-base font-medium text-slate-700"
                >
                  Explore the Workspace
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/70 bg-white/60 py-8 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center text-sm text-slate-500 sm:px-6 lg:flex-row lg:px-8 lg:text-center">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="font-medium text-slate-700">FairAudit</span>
          </div>
          <p>Fair housing governance, explainable screening controls, AI assurance, and audit-ready decision accountability.</p>
        </div>
      </footer>
    </div>
  );
}
