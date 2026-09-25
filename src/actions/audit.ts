"use server";

// Spec §4.K — Audit Log & Evidence Vault Server Actions
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";

export async function getAuditLog(filters?: {
  tableName?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}) {
  const { orgId } = await getAuthContext();
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 50;

  const where = {
    organizationId: orgId,
    ...(filters?.tableName && { tableName: filters.tableName }),
    ...(filters?.action && { action: filters.action }),
    ...(filters?.startDate && {
      timestamp: {
        gte: new Date(filters.startDate),
        ...(filters?.endDate && { lte: new Date(filters.endDate) }),
      },
    }),
  };

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getAuditEntry(id: string) {
  const { orgId } = await getAuthContext();
  return prisma.auditLog.findFirst({
    where: { id, organizationId: orgId },
  });
}

export async function getEvidenceVault(filters?: {
  entityType?: string;
  page?: number;
  pageSize?: number;
}) {
  const { orgId } = await getAuthContext();
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 50;

  const where = {
    organizationId: orgId,
    ...(filters?.entityType && { entityType: filters.entityType }),
  };

  const [items, total] = await Promise.all([
    prisma.evidenceVaultEntry.findMany({
      where,
      orderBy: { storedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.evidenceVaultEntry.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
