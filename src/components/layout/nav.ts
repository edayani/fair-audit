import {
  Activity,
  Archive,
  BarChart3,
  BrainCircuit,
  Building2,
  ClipboardCheck,
  FileText,
  Gavel,
  Landmark,
  Layers,
  LayoutDashboard,
  ScrollText,
  Settings,
  Upload,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavBadgeKey = "pendingReviews" | "newAlerts";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: NavBadgeKey;
  exact?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Overview", exact: true },
      { href: "/dashboard/properties", icon: Building2, label: "Properties" },
      { href: "/dashboard/applications", icon: FileText, label: "Applications" },
      { href: "/dashboard/applicants", icon: Users, label: "Applicants" },
    ],
  },
  {
    label: "Adjudication",
    items: [
      { href: "/dashboard/review-queue", icon: ClipboardCheck, label: "Review Queue", badge: "pendingReviews" },
      { href: "/dashboard/ingestion", icon: Upload, label: "Data Intake" },
      { href: "/dashboard/features", icon: Layers, label: "Feature Governance" },
    ],
  },
  {
    label: "Civil Rights Analytics",
    items: [
      { href: "/dashboard/fairness", icon: BarChart3, label: "Disparate Impact" },
      { href: "/dashboard/monitoring", icon: Activity, label: "Monitoring", badge: "newAlerts" },
      { href: "/dashboard/ai-governance", icon: BrainCircuit, label: "AI Governance" },
    ],
  },
  {
    label: "Legal Record",
    items: [
      { href: "/dashboard/audit-log", icon: ScrollText, label: "Audit Trail" },
      { href: "/dashboard/evidence-vault", icon: Archive, label: "Evidence Vault" },
      { href: "/dashboard/jurisdictions", icon: Landmark, label: "Jurisdictions" },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/dashboard/settings/compliance", icon: Gavel, label: "Legal Standard" },
      { href: "/dashboard/settings", icon: Settings, label: "Settings", exact: true },
    ],
  },
];

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** Find the section/page label for the topbar breadcrumb. */
export function findNavContext(pathname: string): { group?: string; item?: NavItem } {
  let best: { group?: string; item?: NavItem } = {};
  let bestLength = -1;
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      const matches = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
      if (matches && item.href.length > bestLength) {
        best = { group: group.label, item };
        bestLength = item.href.length;
      }
    }
  }
  return best;
}
