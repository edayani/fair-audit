// Spec §4.K — Append-only audit trail and evidence vault writers.
// Server-only helpers (not server actions) so clients cannot forge entries.
import "server-only";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { sha256 } from "@/lib/hash";

export { sha256 };

type Json = Record<string, unknown> | unknown[] | null | undefined;

function toJson(value: Json) {
  return value == null ? undefined : JSON.parse(JSON.stringify(value));
}

/**
 * Record an immutable audit-log entry for the current org and user.
 * Never throws — an audit write failure must not roll back the user's action,
 * but it is logged so it can be investigated.
 */
export async function recordAudit(entry: {
  tableName: string;
  recordId: string;
  action: string;
  before?: Json;
  after?: Json;
  metadata?: Json;
  orgId?: string;
}) {
  try {
    const ctx = await getAuthContext();
    await prisma.auditLog.create({
      data: {
        organizationId: entry.orgId ?? ctx.orgId,
        tableName: entry.tableName,
        recordId: entry.recordId,
        action: entry.action,
        userId: ctx.userId,
        userEmail: ctx.userEmail,
        before: toJson(entry.before),
        after: toJson(entry.after),
        metadata: toJson(entry.metadata),
      },
    });
  } catch (error) {
    console.error("[audit] failed to record entry", entry.tableName, entry.action, error);
  }
}

/**
 * Preserve a document or determination in the evidence vault with a SHA-256
 * content hash, establishing chain of custody for later review.
 */
export async function preserveEvidence(entry: {
  entityType: string;
  entityId: string;
  documentType: string;
  content: unknown;
  description?: string;
  metadata?: Json;
  fileUrl?: string;
}) {
  try {
    const ctx = await getAuthContext();
    const contentHash = sha256(entry.content);
    await prisma.evidenceVaultEntry.create({
      data: {
        organizationId: ctx.orgId,
        entityType: entry.entityType,
        entityId: entry.entityId,
        documentType: entry.documentType,
        fileUrl: entry.fileUrl ?? `vault://${entry.entityType}/${entry.entityId}/${contentHash.slice(0, 12)}`,
        contentHash,
        description: entry.description,
        metadata: toJson({ ...(entry.metadata as Record<string, unknown> | undefined), preservedBy: ctx.userEmail ?? ctx.userId }),
      },
    });
  } catch (error) {
    console.error("[evidence] failed to preserve", entry.entityType, entry.documentType, error);
  }
}
