"use server";

// Spec §4.M — Jurisdiction & Rules Engine Server Actions
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

export async function getJurisdictions() {
  const { orgId } = await getAuthContext();
  return prisma.jurisdiction.findMany({
    where: { organizationId: orgId },
    include: { rules: { orderBy: { effectiveDate: "desc" } } },
    orderBy: { level: "asc" },
  });
}

export async function createJurisdiction(data: {
  name: string;
  code: string;
  level: "FEDERAL" | "STATE" | "LOCAL";
}): Promise<ActionResult<{ id: string }>> {
  const { orgId } = await getAuthContext();

  const jurisdiction = await prisma.jurisdiction.create({
    data: { ...data, organizationId: orgId },
  });

  revalidatePath("/dashboard/jurisdictions");
  return { success: true, data: { id: jurisdiction.id } };
}

export async function createJurisdictionRule(data: {
  jurisdictionId: string;
  category: string;
  ruleKey: string;
  ruleText: string;
  ruleData?: Record<string, unknown>;
  effectiveDate: string;
}): Promise<ActionResult> {
  const { orgId } = await getAuthContext();

  // Verify jurisdiction belongs to org
  await prisma.jurisdiction.findFirstOrThrow({
    where: { id: data.jurisdictionId, organizationId: orgId },
  });

  await prisma.jurisdictionRule.create({
    data: {
      ...data,
      effectiveDate: new Date(data.effectiveDate),
      ruleData: data.ruleData ? JSON.parse(JSON.stringify(data.ruleData)) : undefined,
    },
  });

  revalidatePath("/dashboard/jurisdictions");
  return { success: true };
}

export async function setComplianceMode(
  mode: "FEDERAL_CA" | "COURT_ONLY",
  disclaimerAcknowledged?: boolean
): Promise<ActionResult> {
  const { orgId, userId } = await getAuthContext();

  if (mode === "COURT_ONLY" && !disclaimerAcknowledged) {
    return {
      success: false,
      error: "You must acknowledge the disclaimer before switching to Court-Only mode.",
    };
  }

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      complianceMode: mode,
      ...(mode === "COURT_ONLY" && {
        complianceModeDisclaimerAckedAt: new Date(),
        complianceModeDisclaimerAckedBy: userId,
      }),
    },
  });

  revalidatePath("/dashboard/settings/compliance");
  return { success: true };
}

export async function getComplianceMode() {
  const { orgId } = await getAuthContext();
  const org = await prisma.organization.findFirstOrThrow({
    where: { id: orgId },
    select: { complianceMode: true, complianceModeDisclaimerAckedAt: true },
  });
  return org;
}
