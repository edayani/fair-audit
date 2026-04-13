// Auth helpers — Clerk integration for multi-tenant RLS
// Every server action must call getOrgId() to enforce row-level security
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Resolve Clerk org ID to the database Organization.id.
 * The dashboard layout calls ensureOrganization() on every load,
 * so the record should always exist by the time actions run.
 */
async function resolveDbOrgId(clerkOrgId: string): Promise<string> {
  const org = await prisma.organization.findFirst({
    where: { clerkOrgId },
    select: { id: true },
  });
  if (!org) {
    // Auto-create if missing (defensive — layout should have done this)
    const created = await prisma.organization.create({
      data: { clerkOrgId, name: "My Organization" },
    });
    return created.id;
  }
  return org.id;
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
  return resolveDbOrgId(orgId);
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
 */
export async function getAuthContext() {
  const { orgId, userId } = await auth();
  if (!userId) throw new Error("Authentication required.");
  if (!orgId) throw new Error("No organization selected.");

  const [dbOrgId, user] = await Promise.all([
    resolveDbOrgId(orgId),
    currentUser(),
  ]);

  return {
    orgId: dbOrgId,
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

  const [dbOrgId, user] = await Promise.all([
    resolveDbOrgId(orgId),
    currentUser(),
  ]);

  return {
    orgId: dbOrgId,
    userId,
    userEmail: user?.emailAddresses?.[0]?.emailAddress ?? null,
    userName: user?.fullName ?? null,
  };
}
