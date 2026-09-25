import Link from "next/link";
import {
  Accessibility,
  Archive,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Bot,
  Building2,
  ClipboardCheck,
  FileSearch,
  FileText,
  Fingerprint,
  Gavel,
  HeartHandshake,
  Home,
  KeyRound,
  Landmark,
  Layers,
  Lock,
  MessageSquareWarning,
  Radar,
  Scale,
  ScrollText,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ProductPreview } from "@/components/marketing/product-preview";

const AUTHORITIES = [
  { name: "Fair Housing Act", cite: "42 U.S.C. § 3601 et seq." },
  { name: "Fair Credit Reporting Act", cite: "15 U.S.C. § 1681 et seq." },
  { name: "HUD criminal-records guidance", cite: "HUD OGC, Apr. 4, 2016" },
  { name: "Section 504", cite: "Rehabilitation Act of 1973" },
  { name: "Violence Against Women Act", cite: "34 U.S.C. § 12491" },
  { name: "Source-of-income laws", cite: "e.g., Cal. Gov. Code § 12955" },
];

const PRESSURES = [
  {
    icon: Bot,
    title: "Automated scores, human consequences",
    body: "Screening vendors return opaque scores and raw records. When a facially neutral criterion screens out voucher holders or people with old, dismissed charges, the housing provider — not the vendor — answers for the discriminatory effect.",
  },
  {
    icon: Layers,
    title: "Program rules layered on civil-rights law",
    body: "LIHTC, Housing Choice Vouchers, HOME, and Continuum of Care funding each add obligations — Housing First commitments, VAWA protections, Section 504 — on top of the Fair Housing Act and state law.",
  },
  {
    icon: ScrollText,
    title: "Records reconstructed after the complaint",
    body: "When a fair-housing agency, auditor, or court asks why an applicant was denied, most operators rebuild the story from email. By then the reasoning, the notice, and the chance to cure are gone.",
  },
];

const PILLARS = [
  {
    eyebrow: "Adjudicate",
    title: "Decide on a written standard",
    icon: Gavel,
    items: [
      { icon: BookOpenCheck, name: "Versioned screening policies", body: "Published criteria per property, with guardrails that flag unlawful or high-risk rules as they're drafted." },
      { icon: FileSearch, name: "Data intake & accuracy", body: "Normalize every vendor, match identity, and quarantine stale, mismatched, or disposition-less records." },
      { icon: Scale, name: "Relevance to tenancy", body: "Each record is tested for a genuine nexus to tenancy before it may count against anyone." },
      { icon: ClipboardCheck, name: "Human review queue", body: "Borderline cases route to a qualified reviewer; overrides require a written justification." },
    ],
  },
  {
    eyebrow: "Protect",
    title: "Guarantee the applicant's rights",
    icon: HeartHandshake,
    items: [
      { icon: UserCheck, name: "Individualized assessment", body: "The four-factor review HUD guidance calls for before any criminal-history-based denial." },
      { icon: MessageSquareWarning, name: "Challenge docket", body: "Applicants dispute accuracy, relevance, or offer mitigation — and receive a written resolution." },
      { icon: Accessibility, name: "Reasonable accommodations", body: "Requests tracked through the interactive process without ever recording a diagnosis." },
      { icon: FileText, name: "Adverse-action notices", body: "FCRA-compliant notices with principal reasons, agency disclosures, and dispute rights." },
    ],
  },
  {
    eyebrow: "Monitor",
    title: "Measure outcomes, not intentions",
    icon: BarChart3,
    items: [
      { icon: BarChart3, name: "Disparate-impact testing", body: "Approval rates by protected class against the four-fifths benchmark, with sample-size floors." },
      { icon: Scale, name: "Burden-shifting analysis", body: "A structured record of necessity and less discriminatory alternatives for every flagged disparity." },
      { icon: Radar, name: "Proxy & drift detection", body: "Catch features that stand in for protected traits, and practice drifting from written policy." },
      { icon: Bot, name: "AI governance", body: "Scorecards, model cards, and algorithmic impact assessments aligned to the NIST AI RMF." },
    ],
  },
  {
    eyebrow: "Preserve",
    title: "Keep the administrative record",
    icon: Archive,
    items: [
      { icon: ScrollText, name: "Append-only audit trail", body: "Every determination, review, override, and notice — attributed and time-stamped." },
      { icon: Fingerprint, name: "Evidence vault", body: "Notices and assessments sealed with SHA-256 hashes to establish chain of custody." },
      { icon: Landmark, name: "Jurisdiction overlays", body: "Federal, state, and local rules layered per property; the most protective standard controls." },
      { icon: Lock, name: "Tenant isolation", body: "Every query scoped to your organization; audit and evidence tables reject edits and deletions." },
    ],
  },
];

const STEPS = [
  { title: "Publish a written standard", body: "Adopt versioned, property-specific criteria. FairAudit flags source-of-income screens, blanket criminal bans, and other high-risk rules before they take effect." },
  { title: "Test every record", body: "Vendor data is normalized, matched to the right person, and labeled for relevance. Arrests without convictions, sealed records, and stale filings never reach the decision." },
  { title: "Adjudicate with reasons", body: "The engine applies the policy and states a reason code for every adverse factor. Anything requiring judgment goes to a person — never to a black box." },
  { title: "Give notice, hear the challenge", body: "Applicants receive the principal reasons and their rights, and can contest accuracy, relevance, or offer mitigation. Each challenge ends in a written resolution." },
  { title: "Monitor and preserve", body: "Outcomes are tested for disparate impact across protected classes, drift is flagged daily, and the complete record is preserved for audit or litigation." },
];

const SAFEGUARDS = [
  { safeguard: "Notice of reasons", does: "Plain-language reason codes, each tied to a published criterion", authority: "FCRA § 615(a), 15 U.S.C. § 1681m(a)" },
  { safeguard: "Maximum possible accuracy", does: "Identity matching and quarantine of mismatched or stale records", authority: "FCRA § 607(b), 15 U.S.C. § 1681e(b)" },
  { safeguard: "Opportunity to be heard", does: "Accuracy, relevance, and mitigation challenges resolved in writing", authority: "HUD OGC Guidance on Criminal Records (2016)" },
  { safeguard: "Individualized assessment", does: "Four-factor review before any criminal-history-based denial", authority: "HUD OGC (2016); Cal. Code Regs. tit. 2, § 12264 et seq." },
  { safeguard: "Reasonable accommodation", does: "Interactive process tracked from request to resolution", authority: "42 U.S.C. § 3604(f)(3)(B); Section 504" },
  { safeguard: "Survivor protections", does: "Mitigation pathway for records arising from domestic violence", authority: "VAWA, 34 U.S.C. § 12491" },
  { safeguard: "Source-of-income neutrality", does: "Guardrails against screening out voucher holders", authority: "Cal. Gov. Code § 12955; state & local SOI laws" },
  { safeguard: "Discriminatory-effects review", does: "Four-fifths screening plus a three-step burden-shifting record", authority: "Inclusive Communities, 576 U.S. 519 (2015)" },
];

const AUDIENCES = [
  { icon: Building2, title: "Affordable housing operators", body: "LIHTC, HOME, and project-based Section 8 portfolios that need uniform, well-documented screening across dozens of properties and site teams." },
  { icon: Home, title: "Supportive & homeless housing", body: "Continuum of Care and Housing First programs that must keep barriers low while documenting every denial and accommodation." },
  { icon: KeyRound, title: "Housing authorities & voucher programs", body: "PHAs and partners serving Housing Choice Voucher, HUD-VASH, and Emergency Housing Voucher households." },
  { icon: Users, title: "Asset managers & counsel", body: "Compliance leaders, investors, and outside counsel who need portfolio-wide visibility and a record that holds up." },
];

const FAQ = [
  {
    q: "Does FairAudit make tenant-screening decisions?",
    a: "No. FairAudit applies the written policy you publish, explains the result, and routes anything requiring judgment to a qualified person on your team. It is a compliance and accountability layer — your staff remain the decision-makers.",
  },
  {
    q: "Is FairAudit a consumer reporting agency?",
    a: "No. FairAudit does not furnish consumer reports. It organizes and evaluates the reports your screening vendors provide, and generates the adverse-action notices the Fair Credit Reporting Act requires you to send.",
  },
  {
    q: "How is AI used?",
    a: "Assistively and never autonomously. AI can draft structured criteria from a plain-language policy or suggest features that may act as proxies for protected traits. Every AI output requires human review before it has any effect, and demographic data such as race or disability is never an input to a determination.",
  },
  {
    q: "Which laws and jurisdictions are covered?",
    a: "The federal Fair Housing Act, FCRA, HUD guidance, Section 504, and VAWA, with a California overlay (FEHA, source-of-income protection, and criminal-history regulations) configured by default. Additional state and local rule sets can be layered per property.",
  },
  {
    q: "Does FairAudit replace legal counsel?",
    a: "No. FairAudit operationalizes legal standards and preserves the record, but it does not provide legal advice. We recommend reviewing policies and any narrowing of the governing standard with counsel.",
  },
  {
    q: "Can we try it without real applicant data?",
    a: "Yes. Every new workspace can load a sample portfolio — a LIHTC family property, permanent supportive housing, and a senior community — with applicants, decisions, challenges, notices, and civil-rights analytics.",
  },
];

function SectionHeading({ eyebrow, title, body, center = false }: { eyebrow: string; title: React.ReactNode; body?: React.ReactNode; center?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a57f2c]">{eyebrow}</p>
      <h2 className="mt-3 font-serif text-3xl font-semibold leading-[1.12] tracking-tight text-balance text-slate-950 sm:text-[42px]">{title}</h2>
      {body && <p className="mt-4 text-lg leading-relaxed text-slate-600 text-pretty">{body}</p>}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="bg-[#f7f8fb] text-slate-950">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-[#0b1322] text-white">
          <div className="bg-grid-light absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" aria-hidden />
          <div className="absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(49,86,160,0.35),transparent_65%)]" aria-hidden />
          <div className="relative mx-auto grid max-w-7xl gap-14 px-4 pb-20 pt-16 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-12 lg:px-8 lg:pb-28 lg:pt-24">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
                <span className="size-1.5 rounded-full bg-[#d6b25e]" />
                Fair housing compliance for affordable &amp; supportive housing
              </p>
              <h1 className="mt-6 font-serif text-[42px] font-semibold leading-[1.04] tracking-tight text-balance sm:text-6xl lg:text-[64px]">
                Every screening decision, <span className="text-[#d6b25e]">lawful</span> and defensible.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70 text-pretty">
                FairAudit is AI-assisted compliance infrastructure for property managers of affordable, supportive, and
                homeless housing. Every applicant receives due process — and every determination stands up to a fair-housing
                investigator, an auditor, or a court.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#d6b25e] px-6 py-3 text-[15px] font-semibold text-[#0b1322] shadow-lg shadow-black/20 transition-colors hover:bg-[#e2c276]"
                >
                  Explore with a sample portfolio
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center justify-center rounded-lg border border-white/20 px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-white/10"
                >
                  See how it works
                </Link>
              </div>
              <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-8">
                {[
                  { k: "13", v: "integrated compliance modules" },
                  { k: "8", v: "due-process safeguards mapped to law" },
                  { k: "3", v: "challenge pathways: accuracy, relevance, mitigation" },
                ].map((s) => (
                  <div key={s.v}>
                    <dt className="font-serif text-3xl font-semibold text-white">{s.k}</dt>
                    <dd className="mt-1 text-xs leading-snug text-white/55">{s.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <ProductPreview />
          </div>
        </section>

        {/* Authorities strip */}
        <section aria-label="Legal frameworks" className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Operationalizes the law that governs your screening</p>
            <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
              {AUTHORITIES.map((a) => (
                <li key={a.name} className="text-center">
                  <p className="text-sm font-semibold text-slate-900">{a.name}</p>
                  <p className="mt-0.5 font-serif text-xs italic text-slate-500">{a.cite}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Why */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <SectionHeading
            eyebrow="Why it matters"
            title="Affordable housing runs on screening. Screening runs on legal exposure."
            body="For households leaving homelessness, rebuilding credit, or holding a voucher, a single unexplained denial can mean another night without housing. For operators, the same denial can become a fair-housing complaint with no record to answer it."
          />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {PRESSURES.map((p) => (
              <div key={p.title} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#0b1322] text-[#d6b25e]">
                  <p.icon className="size-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-950">{p.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{p.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-3xl text-sm leading-relaxed text-slate-500">
            Algorithmic tenant screening is now a live civil-rights question: in <em>Louis v. SafeRent Solutions</em> (D. Mass.),
            voucher holders challenged an automated screening score under the Fair Housing Act — a case that settled in 2024.
          </p>
        </section>

        {/* Platform */}
        <section id="platform" className="scroll-mt-20 border-y border-slate-200 bg-white py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="The platform"
              title="One system of record for the entire screening lifecycle."
              body="Thirteen integrated modules take an application from raw consumer report to a reasoned, reviewable, and preserved determination — and keep watch over outcomes across the whole portfolio."
            />
            <div className="mt-14 grid gap-6 lg:grid-cols-2">
              {PILLARS.map((pillar) => (
                <div key={pillar.eyebrow} className="rounded-2xl border border-slate-200 bg-[#f7f8fb] p-6 sm:p-8">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-[#1f3563] text-white">
                      <pillar.icon className="size-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a57f2c]">{pillar.eyebrow}</p>
                      <h3 className="font-serif text-xl font-semibold text-slate-950">{pillar.title}</h3>
                    </div>
                  </div>
                  <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                    {pillar.items.map((item) => (
                      <li key={item.name} className="rounded-xl border border-slate-200 bg-white p-4">
                        <item.icon className="size-4 text-[#1f3563]" />
                        <p className="mt-2.5 text-sm font-semibold text-slate-900">{item.name}</p>
                        <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{item.body}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <SectionHeading
                eyebrow="How it works"
                title="From application to a determination you can defend."
                body="FairAudit sits between your screening vendors and your final decision. It doesn't replace your staff's judgment — it structures it, documents it, and makes it consistent."
              />
              <Link href="/sign-up" className="mt-8 inline-flex items-center gap-2 text-[15px] font-semibold text-[#1f3563] hover:underline">
                Walk through the sample portfolio <ArrowRight className="size-4" />
              </Link>
            </div>
            <ol className="relative space-y-4">
              {STEPS.map((s, i) => (
                <li key={s.title} className="relative flex gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#0b1322] font-serif text-sm font-semibold text-[#d6b25e]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">{s.title}</h3>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Due process / legal framework */}
        <section id="due-process" className="scroll-mt-20 bg-[#0b1322] py-20 text-white lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d6b25e]">Legal framework</p>
              <h2 className="mt-3 font-serif text-3xl font-semibold leading-[1.12] tracking-tight text-balance sm:text-[42px]">
                Procedural fairness, engineered into every decision.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-white/65">
                Each safeguard traces to a specific source of law. The result is equal access to housing in practice — not
                just in policy — and an evidentiary record that shows it.
              </p>
            </div>
            <div className="mt-12 overflow-hidden rounded-2xl border border-white/10">
              <div className="hidden grid-cols-[1fr_1.4fr_1.2fr] gap-6 bg-white/5 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50 md:grid">
                <span>Safeguard</span>
                <span>What FairAudit does</span>
                <span>Authority</span>
              </div>
              <ul className="divide-y divide-white/10">
                {SAFEGUARDS.map((s) => (
                  <li key={s.safeguard} className="grid gap-1 px-6 py-4 md:grid-cols-[1fr_1.4fr_1.2fr] md:gap-6">
                    <span className="font-medium text-white">{s.safeguard}</span>
                    <span className="text-sm leading-relaxed text-white/70">{s.does}</span>
                    <span className="font-serif text-sm italic text-[#d6b25e]/90">{s.authority}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-6 text-xs leading-relaxed text-white/45">
              Citations identify the legal sources each feature is designed around. Applicability depends on the property,
              program, and jurisdiction; consult counsel.
            </p>
          </div>
        </section>

        {/* Who we serve */}
        <section id="who-we-serve" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <SectionHeading
            eyebrow="Who we serve"
            title="Built for the housing where the stakes are highest."
            body="Low-barrier and publicly assisted housing serves the people most exposed to screening errors — and carries the densest web of program rules and civil-rights obligations."
            center
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {AUDIENCES.map((a) => (
              <div key={a.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <a.icon className="size-6 text-[#1f3563]" />
                <h3 className="mt-4 font-semibold text-slate-950">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{a.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Responsible AI + security */}
        <section className="border-y border-slate-200 bg-white py-20 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div id="responsible-ai" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-[#f7f8fb] p-8 sm:p-10">
              <Bot className="size-7 text-[#1f3563]" />
              <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-slate-950">AI that assists. People who decide.</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                Algorithmic accountability is the product, not a disclaimer. Determinations come from a deterministic engine
                applying your written policy; AI only drafts, and a person always approves.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                {[
                  "Demographic data (race, sex, familial status, disability) monitors outcomes — it never scores applicants",
                  "Every AI suggestion is reviewable and never self-executing",
                  "Model card and algorithmic impact assessments aligned to the NIST AI RMF",
                  "Proxy detection for features that stand in for protected characteristics",
                ].map((t) => (
                  <li key={t} className="flex gap-3">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div id="security" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-[#f7f8fb] p-8 sm:p-10">
              <Lock className="size-7 text-[#1f3563]" />
              <h2 className="mt-5 font-serif text-3xl font-semibold tracking-tight text-slate-950">A record built to be relied on.</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
                Compliance evidence is only as good as its integrity. FairAudit is designed so the record can&apos;t be quietly
                rewritten after the fact.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                {[
                  "Organization-scoped data isolation enforced on every query",
                  "Audit and evidence tables reject updates and deletions at the data layer",
                  "SHA-256 content hashes on every preserved notice and assessment",
                  "Encrypted in transit (TLS/HSTS) with attributed, time-stamped actions",
                ].map((t) => (
                  <li key={t} className="flex gap-3">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-4xl scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <SectionHeading eyebrow="Questions" title="Frequently asked questions" center />
          <div className="mt-12 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
            {FAQ.map((item) => (
              <details key={item.q} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium text-slate-950">
                  {item.q}
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-[#0b1322] px-6 py-16 text-center text-white sm:px-12 lg:py-20">
            <div className="bg-grid-light absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" aria-hidden />
            <div className="relative mx-auto max-w-2xl">
              <Scale className="mx-auto size-8 text-[#d6b25e]" />
              <h2 className="mt-5 font-serif text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-5xl">
                Housing is a right worth getting right.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-white/65">
                Create a workspace in minutes and explore FairAudit with a sample affordable-housing portfolio — no applicant
                data required.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#d6b25e] px-6 py-3 text-[15px] font-semibold text-[#0b1322] transition-colors hover:bg-[#e2c276]"
                >
                  Create your workspace
                  <ArrowRight className="size-4" />
                </Link>
                <Link href="/sign-in" className="inline-flex items-center justify-center rounded-lg border border-white/20 px-6 py-3 text-[15px] font-medium hover:bg-white/10">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
