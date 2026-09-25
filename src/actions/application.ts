"use server";

import { prisma } from "@/lib/prisma";
import { getAuthContext, requireFullAccess } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { recordAudit } from "@/lib/audit";
import type { ActionResult } from "@/types";
import type { CreateApplicantInput, CreateApplicationInput } from "@/lib/validators/application";

export async function getApplications(filters?: { propertyId?: string; status?: string; outcome?: string; q?: string }) {
  const { orgId } = await getAuthContext();
  const q = filters?.q?.trim();
  const outcome = filters?.outcome;
  return prisma.application.findMany({
    where: {
      organizationId: orgId,
      ...(filters?.propertyId && { propertyId: filters.propertyId }),
      ...(filters?.status && { status: filters.status }),
      ...(outcome === "UNDECIDED"
        ? { decision: { is: null } }
        : outcome && ["APPROVED", "DENIED", "CONDITIONAL", "PENDING_REVIEW"].includes(outcome)
          ? { decision: { is: { outcome: outcome as "APPROVED" | "DENIED" | "CONDITIONAL" | "PENDING_REVIEW" } } }
          : {}),
      ...(q && {
        applicant: {
          OR: [
            { firstName: { contains: q, mode: "insensitive" as const } },
            { lastName: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        },
      }),
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
  return prisma.application.findFirst({
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
  const denied = await requireFullAccess();
  if (denied) return denied;
  const { orgId } = await getAuthContext();

  const applicant = await prisma.applicant.create({
    data: {
      ...data,
      organizationId: orgId,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    },
  });

  await recordAudit({ tableName: "Applicant", recordId: applicant.id, action: "CREATE" });
  revalidatePath("/dashboard/applicants");
  return { success: true, data: { id: applicant.id } };
}

export async function createApplication(data: CreateApplicationInput): Promise<ActionResult<{ id: string }>> {
  const denied = await requireFullAccess();
  if (denied) return denied;
  const { orgId } = await getAuthContext();

  const [applicant, property] = await Promise.all([
    prisma.applicant.findFirst({ where: { id: data.applicantId, organizationId: orgId }, select: { id: true } }),
    prisma.property.findFirst({ where: { id: data.propertyId, organizationId: orgId }, select: { id: true } }),
  ]);
  if (!applicant || !property) return { success: false, error: "Applicant or property not found" };

  const application = await prisma.application.create({
    data: { ...data, organizationId: orgId },
  });

  await recordAudit({ tableName: "Application", recordId: application.id, action: "CREATE", metadata: { propertyId: data.propertyId } });
  revalidatePath("/dashboard", "layout");
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
  return prisma.applicant.findFirst({
    where: { id, organizationId: orgId },
    include: {
      applications: {
        include: { property: true, decision: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}
