"use server";

import { prisma } from "@/lib/prisma";
import { getAuthContext, requireFullAccess } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { recordAudit } from "@/lib/audit";
import type { ActionResult } from "@/types";

export async function getProperties() {
  const { orgId } = await getAuthContext();
  return prisma.property.findMany({
    where: { organizationId: orgId },
    include: {
      screeningPolicies: { where: { isActive: true }, take: 1 },
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProperty(id: string) {
  const { orgId } = await getAuthContext();
  return prisma.property.findFirst({
    where: { id, organizationId: orgId },
    include: {
      screeningPolicies: { orderBy: { version: "desc" } },
      applications: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { applicant: true, decision: true },
      },
      _count: { select: { applications: true } },
    },
  });
}

export async function createProperty(data: {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  unitCount?: number;
}): Promise<ActionResult<{ id: string }>> {
  const denied = await requireFullAccess();
  if (denied) return denied;
  const { orgId } = await getAuthContext();
  const name = data.name?.trim();
  if (!name) return { success: false, error: "Property name is required" };
  if (data.unitCount != null && (!Number.isFinite(data.unitCount) || data.unitCount < 0)) {
    return { success: false, error: "Unit count must be a positive number" };
  }

  const property = await prisma.property.create({
    data: {
      name,
      address: data.address?.trim() || null,
      city: data.city?.trim() || null,
      state: data.state?.trim().toUpperCase() || null,
      zipCode: data.zipCode?.trim() || null,
      unitCount: data.unitCount ?? null,
      organizationId: orgId,
    },
  });

  await recordAudit({ tableName: "Property", recordId: property.id, action: "CREATE", after: { name: property.name } });

  revalidatePath("/dashboard", "layout");
  return { success: true, data: { id: property.id } };
}

export async function updateProperty(
  id: string,
  data: { name?: string; address?: string; city?: string; state?: string; zipCode?: string; unitCount?: number }
): Promise<ActionResult> {
  const denied = await requireFullAccess();
  if (denied) return denied;
  const { orgId } = await getAuthContext();

  const result = await prisma.property.updateMany({
    where: { id, organizationId: orgId },
    data,
  });
  if (result.count === 0) return { success: false, error: "Property not found" };

  await recordAudit({ tableName: "Property", recordId: id, action: "UPDATE", after: data });

  revalidatePath(`/dashboard/properties/${id}`);
  return { success: true };
}
