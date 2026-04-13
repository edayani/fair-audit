// Spec §4.K — Prisma client singleton with immutable audit-log middleware
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: ReturnType<typeof createPrismaClient> };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL!;
  const adapter = new PrismaPg({ connectionString });
  const basePrisma = new PrismaClient({ adapter });

  // Spec §4.K — Immutable audit log: block mutations on protected tables
  return basePrisma.$extends({
    query: {
      auditLog: {
        async update() { throw new Error("[FairAudit] AuditLog records are immutable (Spec §4.K)"); },
        async updateMany() { throw new Error("[FairAudit] AuditLog records are immutable (Spec §4.K)"); },
        async delete() { throw new Error("[FairAudit] AuditLog records are immutable (Spec §4.K)"); },
        async deleteMany() { throw new Error("[FairAudit] AuditLog records are immutable (Spec §4.K)"); },
      },
      evidenceVaultEntry: {
        async update() { throw new Error("[FairAudit] EvidenceVaultEntry records are immutable (Spec §4.K)"); },
        async updateMany() { throw new Error("[FairAudit] EvidenceVaultEntry records are immutable (Spec §4.K)"); },
        async delete() { throw new Error("[FairAudit] EvidenceVaultEntry records are immutable (Spec §4.K)"); },
        async deleteMany() { throw new Error("[FairAudit] EvidenceVaultEntry records are immutable (Spec §4.K)"); },
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
