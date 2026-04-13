import { getDashboardStats } from "@/actions/settings";
import { PageHeader } from "@/components/shared/page-header";
import { Shield, FileText, ClipboardCheck, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { formatPercent, timeAgo, humanize } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  if (!stats) {
    return (
      <div>
        <PageHeader title="Welcome to FairAudit" description="Create or select an organization to get started." />
        <p className="text-muted-foreground">Use the organization switcher in the top bar to create your first organization, then click Demo Mode to populate sample data.</p>
      </div>
    );
  }

  const statCards = [
    { label: "Total Applications", value: stats.totalApplications, icon: FileText, href: "/dashboard/applications" },
    { label: "Pending Reviews", value: stats.pendingReviews, icon: ClipboardCheck, href: "/dashboard/review-queue" },
    { label: "Active Alerts", value: stats.activeAlerts, icon: AlertTriangle, href: "/dashboard/monitoring" },
    { label: "Approval Rate", value: formatPercent(stats.approvalRate), icon: CheckCircle, href: "/dashboard/fairness" },
    { label: "Denial Rate", value: formatPercent(stats.denialRate), icon: XCircle, href: "/dashboard/fairness" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Fair Housing AI Auditor - Overview" />

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((card) => (
          <Link key={card.label} href={card.href} className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <card.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{card.label}</span>
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        {stats.recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity. Click Demo Mode to populate sample data.</p>
        ) : (
          <div className="space-y-3">
            {stats.recentActivity.map((log) => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{humanize(log.action)} on {humanize(log.tableName)}</p>
                    <p className="text-xs text-muted-foreground">{log.userEmail ?? "System"}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{timeAgo(log.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
