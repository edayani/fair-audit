import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { href: "/#platform", label: "Capabilities" },
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#responsible-ai", label: "Responsible AI" },
      { href: "/#security", label: "Security" },
    ],
  },
  {
    title: "Law & policy",
    links: [
      { href: "/#due-process", label: "Legal framework" },
      { href: "/#who-we-serve", label: "Housing programs" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/sign-up", label: "Create a workspace" },
      { href: "/sign-in", label: "Sign in" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2fr]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Fair housing compliance infrastructure for affordable, supportive, and homeless housing — so every applicant
              receives due process and every determination is defensible on the record.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{col.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-sm text-slate-600 transition-colors hover:text-slate-950">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} FairAudit. All rights reserved.</p>
          <p className="max-w-xl sm:text-right">
            FairAudit is compliance software. It supports — and does not replace — the judgment of qualified staff and
            legal counsel, and nothing on this site is legal advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
