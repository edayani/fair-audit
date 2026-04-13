import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Shield, BarChart3, FileCheck, Scale } from "lucide-react";

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
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
            Fair Housing AI Auditor
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            A compliance and risk-control layer that makes every screening decision
            answerable to five questions: Was the data accurate? Was the criterion relevant?
            Was the rule applied consistently? Did it create discriminatory effects?
            Could the applicant challenge and correct it?
          </p>
          <div className="mt-8">
            <Link href="/sign-up" className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-lg font-medium text-primary-foreground hover:bg-primary/90">
              Start Your Audit
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Shield, title: "Policy Engine", desc: "Define clear, public, customizable screening policies per HUD guidance" },
            { icon: BarChart3, title: "Fairness Monitoring", desc: "Continuous civil-rights monitoring with disparate impact analysis" },
            { icon: FileCheck, title: "Audit Trail", desc: "Immutable evidence vault logging every decision, review, and override" },
            { icon: Scale, title: "Compliance", desc: "Federal FHA + California FEHA + configurable jurisdiction overlays" },
          ].map((feature) => (
            <div key={feature.title} className="rounded-lg border bg-card p-6">
              <feature.icon className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
