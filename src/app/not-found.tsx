import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f6f7fb] text-[#161d2e]">
      <header className="px-6 py-5">
        <Link href="/" aria-label="FairAudit home">
          <Logo />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 pb-24">
        <div className="max-w-lg text-center">
          <p className="font-serif text-7xl font-semibold text-[#1f3563]/15">404</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">This page is not part of the record.</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#5b6478]">
            The page you requested doesn&apos;t exist or has moved. Let&apos;s get you back to solid ground.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/" className={buttonVariants({ size: "lg" })}>
              Return home
            </Link>
            <Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Open workspace
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
