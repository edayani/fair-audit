"use server";

import { prisma } from "@/lib/prisma";
import { getAuthContext, getAuthContextSafe } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

export async function getOrganization() {
  const { orgId } = await getAuthContext();
  return prisma.organization.findFirst({
    where: { id: orgId },
  });
}

export async function ensureOrganization(): Promise<string> {
  // getAuthContext already ensures the org record exists (via resolveDbOrgId)
  const { orgId } = await getAuthContext();
  return orgId;
}

export async function updateOrganization(data: {
  name?: string;
}): Promise<ActionResult> {
  const { orgId } = await getAuthContext();

  await prisma.organization.updateMany({
    where: { id: orgId },
    data,
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function getDashboardStats() {
  const ctx = await getAuthContextSafe();
  if (!ctx) return null;
  const { orgId } = ctx;

  const [
    totalApplications,
    pendingReviews,
    activeAlerts,
    approved,
    denied,
    recentLogs,
  ] = await Promise.all([
    prisma.application.count({ where: { organizationId: orgId } }),
    prisma.decision.count({
      where: { outcome: "PENDING_REVIEW", application: { organizationId: orgId } },
    }),
    prisma.driftAlert.count({
      where: { organizationId: orgId, status: "NEW" },
    }),
    prisma.decision.count({
      where: { outcome: "APPROVED", application: { organizationId: orgId } },
    }),
    prisma.decision.count({
      where: { outcome: "DENIED", application: { organizationId: orgId } },
    }),
    prisma.auditLog.findMany({
      where: { organizationId: orgId },
      orderBy: { timestamp: "desc" },
      take: 10,
    }),
  ]);

  const total = approved + denied;
  return {
    totalApplications,
    pendingReviews,
    activeAlerts,
    approvalRate: total > 0 ? approved / total : 0,
    denialRate: total > 0 ? denied / total : 0,
    avgReviewTime: 0,
    recentActivity: recentLogs,
  };
}
