"use client";

import { OrganizationList, UserButton } from "@clerk/nextjs";
import { Building2, FileCheck2, Scale } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { clerkAuthAppearance } from "@/lib/clerk-appearance";

const steps = [
  { icon: Building2, title: "Create your organization", body: "A workspace for your housing portfolio, staff, and reviewers." },
  { icon: Scale, title: "Load the sample portfolio", body: "Explore review, notices, and disparate-impact analytics immediately." },
  { icon: FileCheck2, title: "Request full access", body: "Record determinations to an append-only legal record." },
];

export function OrgOnboarding() {
  return (
    <div className="min-h-screen bg-[#f6f7fb] text-[#161d2e]">
      <header className="flex h-16 items-center justify-between border-b border-[#e3e7ef] bg-white px-4 sm:px-8">
        <Logo />
        <UserButton />
      </header>
      <main className="mx-auto grid max-w-5xl gap-10 px-4 py-10 sm:px-8 lg:grid-cols-[1fr_420px] lg:py-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a57f2c]">Welcome to FairAudit</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight tracking-tight text-balance">
            Set up the workspace your compliance record will live in.
          </h1>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[#5b6478]">
            FairAudit organizes screening policies, adjudications, and evidence by organization so that every
            determination is attributable, reviewable, and preserved for the administrative record.
          </p>
          <ol className="mt-8 space-y-4">
            {steps.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#e3e7ef] bg-white text-[#1f3563]">
                  <step.icon className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    <span className="mr-1.5 text-[#a57f2c] tabular">{String(i + 1).padStart(2, "0")}</span>
                    {step.title}
                  </p>
                  <p className="text-sm text-[#5b6478]">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex justify-center lg:justify-end">
          <OrganizationList
            hidePersonal
            afterCreateOrganizationUrl="/dashboard"
            afterSelectOrganizationUrl="/dashboard"
            appearance={clerkAuthAppearance}
          />
        </div>
      </main>
    </div>
  );
}
