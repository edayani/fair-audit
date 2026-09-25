import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Circle, CircleDashed, History, ListChecks, MinusCircle, User } from "lucide-react";
import { getApplication } from "@/actions/application";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { Card, CardContent, CardHeaderRow } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatDate, formatDateTime, getOutcomeSurface, humanize } from "@/lib/utils";
import { describeAuditAction } from "@/lib/audit-labels";

export const metadata = { title: "Application" };

type StepState = "done" | "pending" | "na";

export default async function ApplicationSummaryPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  const app = await getApplication(applicationId);
  if (!app) notFound();
  const { orgId } = await getAuthContext();

  const [assessment, timeline] = await Promise.all([
    app.decision ? prisma.individualizedAssessment.findUnique({ where: { decisionId: app.decision.id }, select: { id: true } }) : null,
    prisma.auditLog.findMany({
      where: {
        organizationId: orgId,
        OR: [{ recordId: applicationId }, { metadata: { path: ["applicationId"], equals: applicationId } }],
      },
      orderBy: { timestamp: "desc" },
      take: 12,
    }),
  ]);

  const d = app.decision;
  const base = `/dashboard/applications/${applicationId}`;
  const involvesCriminal = d?.reasonCodes.some((rc) => rc.category === "Criminal") ?? false;
  const adverse = d && (d.outcome === "DENIED" || d.outcome === "CONDITIONAL");
  const openChallenges = app.challenges.filter((c) => c.status === "SUBMITTED" || c.status === "UNDER_REVIEW").length;

  const steps: Array<{ label: string; detail: string; state: StepState; href: string }> = [
    {
      label: "Consumer report data ingested",
      detail: `${app.screeningRecords.length} record${app.screeningRecords.length === 1 ? "" : "s"} from ${new Set(app.screeningRecords.map((r) => r.vendorName)).size} vendor(s)`,
      state: app.screeningRecords.length > 0 ? "done" : "pending",
      href: `${base}/records`,
    },
    {
      label: "Identity resolution & relevance labeling",
      detail: "Mismatched or stale records quarantined; each record tested for relevance to tenancy",
      state: app.screeningRecords.some((r) => r.relevance) ? "done" : app.screeningRecords.length ? "pending" : "na",
      href: `${base}/records`,
    },
    {
      label: "Determination with reason codes",
      detail: d ? `${humanize(d.outcome)} under ${d.screeningPolicy.name} v${d.screeningPolicy.version}` : "Run the screening pipeline to issue a determination",
      state: d ? "done" : "pending",
      href: `${base}/decision`,
    },
    {
      label: "Individualized assessment",
      detail: involvesCriminal ? "Required by HUD guidance before any criminal-history-based denial" : "Not required — no criminal-history factors",
      state: involvesCriminal ? (assessment ? "done" : "pending") : "na",
      href: `${base}/decision`,
    },
    {
      label: "Human review",
      detail: d?.humanReview
        ? `${humanize(d.humanReview.action)} by ${d.humanReview.reviewer.name ?? d.humanReview.reviewer.email}`
        : d?.outcome === "PENDING_REVIEW"
          ? "Awaiting a qualified reviewer"
          : d?.override
            ? "Overridden with written justification"
            : "Not required for automatic determinations",
      state: d?.humanReview || d?.override ? "done" : d?.outcome === "PENDING_REVIEW" ? "pending" : "na",
      href: "/dashboard/review-queue",
    },
    {
      label: "Adverse-action notice",
      detail: adverse ? "FCRA § 615(a) notice with principal reasons and dispute rights" : "Not required for this outcome",
      state: adverse ? (app.notices.length > 0 ? "done" : "pending") : "na",
      href: `${base}/notice`,
    },
    {
      label: "Challenges & accommodations resolved",
      detail: openChallenges > 0 ? `${openChallenges} open challenge(s) awaiting a written resolution` : "No open challenges",
      state: openChallenges > 0 ? "pending" : app.challenges.length > 0 ? "done" : "na",
      href: `${base}/challenge`,
    },
  ];

  const stepIcon = (state: StepState) =>
    state === "done" ? (
      <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
    ) : state === "pending" ? (
      <CircleDashed className="size-5 text-amber-600 dark:text-amber-400" />
    ) : (
      <MinusCircle className="size-5 text-muted-foreground/50" />
    );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {d ? (
          <div className={cn("rounded-xl border p-5", getOutcomeSurface(d.outcome))}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Determination</p>
                <p className="mt-1 font-serif text-2xl font-semibold">{humanize(d.outcome)}</p>
                <p className="mt-1 text-sm opacity-80">
                  {d.isAutomatic ? "Automatic" : "Routed for review"} · confidence {d.confidenceScore?.toFixed(0) ?? "—"}% · {formatDate(d.decidedAt)}
                </p>
              </div>
              <Link href={`${base}/decision`} className={buttonVariants({ variant: "outline", size: "sm", className: "bg-card/80" })}>
                Full rationale
                <ArrowRight />
              </Link>
            </div>
            {d.reasonCodes.length > 0 && (
              <ul className="mt-4 space-y-1.5 border-t border-current/10 pt-4">
                {d.reasonCodes.map((rc) => (
                  <li key={rc.id} className="flex gap-2 text-sm">
                    <span className="font-mono text-xs font-semibold opacity-80">{rc.code}</span>
                    <span>{rc.shortText}</span>
                  </li>
                ))}
              </ul>
            )}
            {d.override && (
              <p className="mt-3 text-sm">
                Overridden from <strong>{humanize(d.override.originalOutcome)}</strong> to <strong>{humanize(d.override.newOutcome)}</strong>.
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-card p-6 text-center">
            <p className="font-medium">No determination yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Run the screening pipeline from the records tab to evaluate this application.</p>
            <Link href={`${base}/records`} className={buttonVariants({ size: "sm", className: "mt-4" })}>
              Go to screening records
            </Link>
          </div>
        )}

        <Card>
          <CardHeaderRow icon={ListChecks} title="Procedural checklist" description="Safeguards that make this determination defensible on the record." />
          <ul className="divide-y">
            {steps.map((step) => (
              <li key={step.label}>
                <Link href={step.href} className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-muted/40 sm:px-6">
                  <span className="mt-0.5">{stepIcon(step.state)}</span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-sm font-medium", step.state === "na" && "text-muted-foreground")}>{step.label}</span>
                    <span className="block text-xs text-muted-foreground">{step.detail}</span>
                  </span>
                  {step.state === "pending" && <Badge tone="warning">Action needed</Badge>}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeaderRow icon={User} title="Applicant" />
          <CardContent className="space-y-3 text-sm">
            <Fact label="Name" value={`${app.applicant.firstName} ${app.applicant.lastName}`} />
            <Fact label="Email" value={app.applicant.email ?? "—"} />
            <Fact label="Unit" value={app.unitAppliedFor ?? "—"} />
            <Fact label="Source of income" value={app.applicant.sourceOfIncome ?? "—"} />
            {app.hasVoucher && <Fact label="Voucher" value={`${app.voucherType ?? "Voucher"}${app.voucherAmount ? ` · $${app.voucherAmount.toLocaleString()}/mo` : ""}`} />}
            <Link href={`/dashboard/applicants/${app.applicantId}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Applicant profile <ArrowRight className="size-3.5" />
            </Link>
            <p className="border-t pt-3 text-xs leading-relaxed text-muted-foreground">
              Demographic data is collected voluntarily for civil-rights monitoring only and is never an input to the determination.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeaderRow icon={History} title="Case history" description="From the append-only audit trail" />
          {timeline.length === 0 ? (
            <CardContent className="text-sm text-muted-foreground">No recorded actions yet.</CardContent>
          ) : (
            <ol className="relative space-y-4 px-5 py-5 sm:px-6">
              {timeline.map((t, i) => (
                <li key={t.id} className="relative flex gap-3">
                  <span className="relative flex flex-col items-center">
                    <Circle className="size-2.5 fill-primary text-primary" />
                    {i < timeline.length - 1 && <span className="absolute top-3 h-[calc(100%+0.5rem)] w-px bg-border" />}
                  </span>
                  <span className="-mt-1 min-w-0">
                    <span className="block text-sm">{describeAuditAction(t.action, t.tableName)}</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatDateTime(t.timestamp)} · {t.userEmail ?? "System"}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
