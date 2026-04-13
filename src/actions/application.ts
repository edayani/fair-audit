"use server";

import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import type { CreateApplicantInput, CreateApplicationInput } from "@/lib/validators/application";

export async function getApplications(filters?: { propertyId?: string; status?: string }) {
  const { orgId } = await getAuthContext();
  return prisma.application.findMany({
    where: {
      organizationId: orgId,
      ...(filters?.propertyId && { propertyId: filters.propertyId }),
      ...(filters?.status && { status: filters.status }),
    },
    include: {
      applicant: true,
      property: true,
      decision: { include: { reasonCodes: true } },
      _count: { select: { challenges: true, screeningRecords: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getApplication(id: string) {
  const { orgId } = await getAuthContext();
  return prisma.application.findFirstOrThrow({
    where: { id, organizationId: orgId },
    include: {
      applicant: true,
      property: true,
      decision: {
        include: {
          reasonCodes: { include: { policyRule: true }, orderBy: { sortOrder: "asc" } },
          humanReview: { include: { reviewer: true } },
          override: { include: { overriddenBy: true } },
          screeningPolicy: true,
        },
      },
      screeningRecords: { orderBy: { createdAt: "desc" } },
      challenges: { include: { documents: true }, orderBy: { createdAt: "desc" } },
      notices: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
      accommodations: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function createApplicant(data: CreateApplicantInput): Promise<ActionResult<{ id: string }>> {
  const { orgId } = await getAuthContext();

  const applicant = await prisma.applicant.create({
    data: {
      ...data,
      organizationId: orgId,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    },
  });

  return { success: true, data: { id: applicant.id } };
}

export async function createApplication(data: CreateApplicationInput): Promise<ActionResult<{ id: string }>> {
  const { orgId } = await getAuthContext();

  const application = await prisma.application.create({
    data: { ...data, organizationId: orgId },
  });

  revalidatePath("/dashboard/applications");
  return { success: true, data: { id: application.id } };
}

export async function getApplicants() {
  const { orgId } = await getAuthContext();
  return prisma.applicant.findMany({
    where: { organizationId: orgId },
    include: { _count: { select: { applications: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getApplicant(id: string) {
  const { orgId } = await getAuthContext();
  return prisma.applicant.findFirstOrThrow({
    where: { id, organizationId: orgId },
    include: {
      applications: {
        include: { property: true, decision: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
