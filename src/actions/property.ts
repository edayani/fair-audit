"use server";

import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { revalidatePath } from "next/cache";
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
  return prisma.property.findFirstOrThrow({
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
  const { orgId } = await getAuthContext();

  const property = await prisma.property.create({
    data: { ...data, organizationId: orgId },
  });

  revalidatePath("/dashboard/properties");
  return { success: true, data: { id: property.id } };
}

export async function updateProperty(
  id: string,
  data: { name?: string; address?: string; city?: string; state?: string; zipCode?: string; unitCount?: number }
): Promise<ActionResult> {
  const { orgId } = await getAuthContext();

  await prisma.property.updateMany({
    where: { id, organizationId: orgId },
    data,
  });

  revalidatePath(`/dashboard/properties/${id}`);
  return { success: true };
}
