import Link from "next/link";
import { ArrowRight, Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const NAV = [
  { href: "/#platform", label: "Platform" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#due-process", label: "Legal framework" },
  { href: "/#who-we-serve", label: "Who we serve" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="FairAudit home" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 text-sm text-slate-600 lg:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-slate-950">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/sign-in" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 sm:inline-flex">
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1f3563] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#182a4f]"
          >
            Get started
            <ArrowRight className="size-4" />
          </Link>
          <details className="group relative lg:hidden">
            <summary className="flex size-9 cursor-pointer list-none items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 [&::-webkit-details-marker]:hidden" aria-label="Open menu">
              <Menu className="size-5" />
            </summary>
            <div className="absolute right-0 top-11 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                  {item.label}
                </Link>
              ))}
              <div className="my-1 border-t border-slate-100" />
              <Link href="/sign-in" className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100">
                Sign in
              </Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
