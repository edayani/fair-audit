import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Gavel,
  MessageSquareWarning,
  Plus,
  Scale,
  ScrollText,
} from "lucide-react";
import { getDashboardStats } from "@/actions/settings";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard, Meter } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeaderRow } from "@/components/ui/card";
import { Badge, SeverityBadge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DemoModeButton } from "@/components/demo/demo-mode-button";
import { formatPercent, humanize, timeAgo } from "@/lib/utils";
import { describeAuditAction } from "@/lib/audit-labels";

export const metadata = { title: "Overview" };

const OUTCOME_ROWS = [
  { key: "APPROVED", label: "Approved", bar: "bg-emerald-500" },
  { key: "CONDITIONAL", label: "Conditional", bar: "bg-amber-500" },
  { key: "DENIED", label: "Denied", bar: "bg-rose-500" },
  { key: "PENDING_REVIEW", label: "Pending review", bar: "bg-sky-500" },
] as const;

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  if (!stats) return null;

  if (stats.totalApplications === 0 && stats.propertyCount === 0) {
    return (
      <div>
        <PageHeader
          eyebrow="Overview"
          title="Welcome to your compliance workspace"
          description="Start with the sample portfolio to see how FairAudit adjudicates screening decisions, or add your first property."
        />
        <EmptyState
          icon={Scale}
          title="No properties or applications yet"
          description="The sample portfolio includes a LIHTC family property, permanent supportive housing, and a senior community — with applicants, screening records, decisions, challenges, and disparate-impact analytics."
        >
          <DemoModeButton variant="hero" />
          <Link href="/dashboard/properties/new" className={buttonVariants({ variant: "outline", size: "lg" })}>
            <Plus />
            Add a property
          </Link>
        </EmptyState>
      </div>
    );
  }

  const posture = [
    {
      label: "Explainability",
      detail: "Adverse determinations carry plain-language reason codes",
      value: stats.posture.explainability,
    },
    {
      label: "Notice coverage",
      detail: "Denials and conditional approvals with an FCRA adverse-action notice",
      value: stats.posture.noticeCoverage,
    },
    {
      label: "Individualized assessment",
      detail: "Criminal-history determinations with a documented four-factor assessment",
      value: stats.posture.individualizedAssessment,
    },
    {
      label: "Human oversight",
      detail: "Determinations reviewed or overridden by a qualified reviewer",
      value: stats.posture.humanOversight,
    },
  ];

  const maxOutcome = Math.max(1, ...OUTCOME_ROWS.map((r) => stats.outcomes[r.key] ?? 0));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Compliance command center"
        description="Portfolio-wide posture across screening adjudications, due-process safeguards, and civil-rights monitoring."
      >
        <Link href="/dashboard/review-queue" className={buttonVariants({ variant: "outline" })}>
          <ClipboardCheck />
          Review queue
        </Link>
        <Link href="/dashboard/fairness" className={buttonVariants()}>
          <Scale />
          Disparate impact
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Applications"
          value={stats.totalApplications}
          hint={`${stats.propertyCount} properties · ${stats.applicantCount} applicants`}
          icon={FileText}
          href="/dashboard/applications"
        />
        <StatCard
          label="Awaiting human review"
          value={stats.pendingReviews}
          hint={stats.pendingReviews > 0 ? "Adjudication required before notice" : "Queue is clear"}
          icon={ClipboardCheck}
          tone={stats.pendingReviews > 0 ? "info" : "success"}
          href="/dashboard/review-queue"
        />
        <StatCard
          label="Open challenges"
          value={stats.openChallenges}
          hint={`${stats.pendingAccommodations} accommodation request${stats.pendingAccommodations === 1 ? "" : "s"} pending`}
          icon={MessageSquareWarning}
          tone={stats.openChallenges > 0 ? "warning" : "default"}
          href="/dashboard/applications"
        />
        <StatCard
          label="Lowest impact ratio"
          value={stats.lowestImpact ? stats.lowestImpact.impactRatio.toFixed(2) : "—"}
          hint={
            stats.lowestImpact
              ? `${humanize(stats.lowestImpact.protectedClass)} · four-fifths threshold 0.80`
              : "Not enough decided applications yet"
          }
          icon={Scale}
          tone={stats.lowestImpact ? (stats.lowestImpact.impactRatio < 0.8 ? "danger" : "success") : "default"}
          href="/dashboard/fairness"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeaderRow
            icon={Gavel}
            title="Due-process posture"
            description="How consistently procedural safeguards are applied across determinations."
          />
          <CardContent className="grid gap-5 sm:grid-cols-2">
            {posture.map((p) => {
              const tone = p.value == null ? "default" : p.value >= 0.9 ? "success" : p.value >= 0.6 ? "warning" : "danger";
              return (
                <div key={p.label}>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium">{p.label}</p>
                    <p className="font-serif text-lg font-semibold tabular">{p.value == null ? "N/A" : formatPercent(p.value, 0)}</p>
                  </div>
                  <Meter value={p.value ?? 0} tone={tone} className="mt-2" label={p.label} />
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{p.detail}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeaderRow icon={Activity} title="Determinations" description={`${stats.totalDecisions} decisions on record`} />
          <CardContent className="space-y-3.5">
            {OUTCOME_ROWS.map((row) => {
              const count = stats.outcomes[row.key] ?? 0;
              return (
                <div key={row.key}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-medium tabular">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${row.bar}`} style={{ width: `${(count / maxOutcome) * 100}%` }} />
                  </div>
                </div>
              );
            })}
            <div className="grid grid-cols-2 gap-3 border-t pt-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Approval rate</p>
                <p className="font-serif text-xl font-semibold tabular">{formatPercent(stats.approvalRate, 0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Overrides</p>
                <p className="font-serif text-xl font-semibold tabular">{stats.overrideCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeaderRow
            icon={ClipboardCheck}
            title="Next up for adjudication"
            description="Oldest pending determinations first."
            actions={
              <Link href="/dashboard/review-queue" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                View all
                <ArrowRight />
              </Link>
            }
          />
          {stats.reviewQueue.length === 0 ? (
            <CardContent>
              <div className="flex items-center gap-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                <CheckCircle2 className="size-4" />
                No determinations are awaiting human review.
              </div>
            </CardContent>
          ) : (
            <ul className="divide-y">
              {stats.reviewQueue.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/dashboard/applications/${d.applicationId}`}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-muted/40 sm:px-6"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {d.application.applicant.firstName} {d.application.applicant.lastName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {d.application.property.name}
                        {d.reasonCodes[0] ? ` · ${d.reasonCodes[0].shortText}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(d.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeaderRow
            icon={AlertTriangle}
            title="Monitoring alerts"
            actions={
              <Link href="/dashboard/monitoring" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                All
                <ArrowRight />
              </Link>
            }
          />
          {stats.alerts.length === 0 ? (
            <CardContent className="text-sm text-muted-foreground">No open drift or disparity alerts.</CardContent>
          ) : (
            <ul className="divide-y">
              {stats.alerts.map((a) => (
                <li key={a.id} className="px-5 py-3.5 sm:px-6">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-snug">{a.title}</p>
                    <SeverityBadge severity={a.severity} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {humanize(a.driftType)} · {timeAgo(a.detectedAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeaderRow
          icon={ScrollText}
          title="Recent activity"
          description={`${stats.auditCount} entries in the append-only audit trail · ${stats.evidenceCount} preserved artifacts`}
          actions={
            <Link href="/dashboard/audit-log" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Audit trail
              <ArrowRight />
            </Link>
          }
        />
        {stats.recentActivity.length === 0 ? (
          <CardContent className="text-sm text-muted-foreground">
            Activity appears here as determinations, notices, and reviews are recorded.
          </CardContent>
        ) : (
          <ul className="divide-y">
            {stats.recentActivity.map((log) => (
              <li key={log.id} className="flex items-center justify-between gap-4 px-5 py-3 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <Building2 className="size-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm">{describeAuditAction(log.action, log.tableName)}</p>
                    <p className="truncate text-xs text-muted-foreground">{log.userEmail ?? "System"}</p>
                  </div>
                </div>
                <Badge className="hidden shrink-0 sm:inline-flex">{timeAgo(log.timestamp)}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
