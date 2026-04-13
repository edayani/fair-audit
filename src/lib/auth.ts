// Auth helpers — Clerk integration for multi-tenant RLS
// Every server action must call getOrgId() to enforce row-level security
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { AccessTier } from "@/generated/prisma/client";

/**
 * Resolve Clerk org ID to the database Organization.id and accessTier.
 * The dashboard layout calls ensureOrganization() on every load,
 * so the record should always exist by the time actions run.
 */
async function resolveDbOrg(clerkOrgId: string): Promise<{ id: string; accessTier: AccessTier }> {
  const org = await prisma.organization.findFirst({
    where: { clerkOrgId },
    select: { id: true, accessTier: true },
  });
  if (!org) {
    // Auto-create if missing (defensive — layout should have done this)
    const created = await prisma.organization.create({
      data: { clerkOrgId, name: "My Organization" },
    });
    return { id: created.id, accessTier: created.accessTier };
  }
  return org;
}

/**
 * Get the current organization's DB ID.
 * Throws if no organization is selected — enforces multi-tenant boundary.
 */
export async function getOrgId(): Promise<string> {
  const { orgId } = await auth();
  if (!orgId) {
    throw new Error(
      "No organization selected. Please select or create an organization."
    );
  }
  const org = await resolveDbOrg(orgId);
  return org.id;
}

/**
 * Get the current user ID from Clerk.
 * Throws if not authenticated.
 */
export async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Authentication required.");
  }
  return userId;
}

/**
 * Get both org (DB ID) and user context for server actions.
 * Includes accessTier for preview mode gating.
 */
export async function getAuthContext() {
  const { orgId, userId } = await auth();
  if (!userId) throw new Error("Authentication required.");
  if (!orgId) throw new Error("No organization selected.");

  const [dbOrg, user] = await Promise.all([
    resolveDbOrg(orgId),
    currentUser(),
  ]);

  return {
    orgId: dbOrg.id,
    accessTier: dbOrg.accessTier,
    userId,
    userEmail: user?.emailAddresses?.[0]?.emailAddress ?? null,
    userName: user?.fullName ?? null,
  };
}

/**
 * Safe version that returns null instead of throwing when no org is selected.
 * Use this in pages that should render gracefully without an org.
 */
export async function getAuthContextSafe() {
  const { orgId, userId } = await auth();
  if (!userId || !orgId) return null;

  const [dbOrg, user] = await Promise.all([
    resolveDbOrg(orgId),
    currentUser(),
  ]);

  return {
    orgId: dbOrg.id,
    accessTier: dbOrg.accessTier,
    userId,
    userEmail: user?.emailAddresses?.[0]?.emailAddress ?? null,
    userName: user?.fullName ?? null,
  };
}

/**
 * Guard for write operations — returns an error result if the org is in PREVIEW mode.
 * Call at the top of any server action that mutates data.
 * Returns null if access is allowed (FULL tier).
 */
export async function requireFullAccess(): Promise<{ success: false; error: string } | null> {
  const ctx = await getAuthContext();
  if (ctx.accessTier === "PREVIEW") {
    return { success: false, error: "This feature requires full access. Request access in Settings." };
  }
  return null;
}
