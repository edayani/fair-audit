"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Shield, Building2, Users, FileText, Upload,
  ClipboardCheck, BarChart3, Layers, Scale,
  ScrollText, Archive, Activity, Settings, ChevronLeft, ChevronRight,
  BrainCircuit
} from "lucide-react";
import { useState } from "react";

const navGroups = [
  {
    label: "Screening",
    items: [
      { href: "/dashboard", icon: Shield, label: "Overview" },
      { href: "/dashboard/properties", icon: Building2, label: "Properties" },
      { href: "/dashboard/applications", icon: FileText, label: "Applications" },
      { href: "/dashboard/applicants", icon: Users, label: "Applicants" },
      { href: "/dashboard/ingestion", icon: Upload, label: "Data Ingestion" },
    ],
  },
  {
    label: "Analysis",
    items: [
      { href: "/dashboard/review-queue", icon: ClipboardCheck, label: "Review Queue" },
      { href: "/dashboard/fairness", icon: BarChart3, label: "Fairness" },
      { href: "/dashboard/features", icon: Layers, label: "Feature Registry" },
      { href: "/dashboard/jurisdictions", icon: Scale, label: "Jurisdictions" },
    ],
  },
  {
    label: "Compliance",
    items: [
      { href: "/dashboard/audit-log", icon: ScrollText, label: "Audit Log" },
      { href: "/dashboard/evidence-vault", icon: Archive, label: "Evidence Vault" },
      { href: "/dashboard/monitoring", icon: Activity, label: "Monitoring" },
      { href: "/dashboard/ai-governance", icon: BrainCircuit, label: "AI Governance" },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/dashboard/settings", icon: Settings, label: "Settings" },
      { href: "/dashboard/settings/compliance", icon: Scale, label: "Compliance Mode" },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      "flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">FairAudit</span>
          </Link>
        )}
        {collapsed && <Shield className="h-6 w-6 text-primary mx-auto" />}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded hover:bg-sidebar-accent">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            {!collapsed && (
              <p className="px-4 mb-1 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    collapsed && "justify-center px-2"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
