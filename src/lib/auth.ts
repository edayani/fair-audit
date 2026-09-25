// Auth helpers — Clerk integration for multi-tenant RLS
// Every server action must call getAuthContext()/getOrgId() to enforce row-level security.
// Lookups are wrapped in React cache() so a single request resolves the org/user once.
import { cache } from "react";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { AccessTier } from "@/generated/prisma/client";

/**
 * Resolve Clerk org ID to the database Organization.id and accessTier,
 * creating the record on first sight so new orgs work without the webhook.
 */
const PLACEHOLDER_ORG_NAME = "My Organization";

async function fetchClerkOrgName(clerkOrgId: string): Promise<string | null> {
  try {
    const clerk = await clerkClient();
    const org = await clerk.organizations.getOrganization({ organizationId: clerkOrgId });
    return org.name || null;
  } catch {
    return null;
  }
}

const resolveDbOrg = cache(async (clerkOrgId: string): Promise<{ id: string; accessTier: AccessTier }> => {
  const org = await prisma.organization.findUnique({
    where: { clerkOrgId },
    select: { id: true, accessTier: true },
  });
  if (org) return org;
  const name = (await fetchClerkOrgName(clerkOrgId)) ?? PLACEHOLDER_ORG_NAME;
  return prisma.organization.upsert({
    where: { clerkOrgId },
    create: { clerkOrgId, name },
    update: {},
    select: { id: true, accessTier: true },
  });
});

const loadContext = cache(async () => {
  const { orgId, userId } = await auth();
  if (!userId || !orgId) return { userId, orgId, ctx: null };

  const [dbOrg, user] = await Promise.all([resolveDbOrg(orgId), currentUser()]);

  return {
    userId,
    orgId,
    ctx: {
      orgId: dbOrg.id,
      clerkOrgId: orgId,
      accessTier: dbOrg.accessTier,
      userId,
      userEmail: user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? null,
      userName: user?.fullName ?? null,
    },
  };
});

/**
 * Get the current organization's DB ID.
 * Throws if no organization is selected — enforces multi-tenant boundary.
 */
export async function getOrgId(): Promise<string> {
  const { ctx } = await getAuthContextOrThrow();
  return ctx.orgId;
}

/**
 * Get the current user ID from Clerk.
 * Throws if not authenticated.
 */
export async function getUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Authentication required.");
  return userId;
}

async function getAuthContextOrThrow() {
  const loaded = await loadContext();
  if (!loaded.userId) throw new Error("Authentication required.");
  if (!loaded.ctx) throw new Error("No organization selected. Please select or create an organization.");
  return { ctx: loaded.ctx };
}

/**
 * Get both org (DB ID) and user context for server actions.
 * Includes accessTier for preview mode gating.
 */
export async function getAuthContext() {
  const { ctx } = await getAuthContextOrThrow();
  return ctx;
}

/**
 * Safe version that returns null instead of throwing when no org is selected.
 * Use this in layouts/pages that should render gracefully without an org.
 */
export async function getAuthContextSafe() {
  const loaded = await loadContext();
  return loaded.ctx;
}

/**
 * Ensure a User row exists for the signed-in Clerk user (needed for reviewer /
 * override foreign keys and the admin roster). Returns the DB User.id.
 */
export const getDbUserId = cache(async (): Promise<string> => {
  const ctx = await getAuthContext();
  const user = await prisma.user.upsert({
    where: { clerkUserId: ctx.userId },
    create: {
      clerkUserId: ctx.userId,
      email: ctx.userEmail ?? "",
      name: ctx.userName,
      organizationId: ctx.orgId,
    },
    update: {
      organizationId: ctx.orgId,
      ...(ctx.userEmail ? { email: ctx.userEmail } : {}),
      ...(ctx.userName ? { name: ctx.userName } : {}),
    },
    select: { id: true },
  });
  return user.id;
});

/**
 * Guard for write operations — returns an error result if the org is in PREVIEW mode.
 * Call at the top of any server action that mutates data.
 * Returns null if access is allowed (FULL tier).
 */
export async function requireFullAccess(): Promise<{ success: false; error: string } | null> {
  const ctx = await getAuthContext();
  if (ctx.accessTier === "PREVIEW") {
    return {
      success: false,
      error: "Your workspace is in Preview mode. Request full access in Settings to record decisions.",
    };
  }
  return null;
}

/** Whether the signed-in user is the platform administrator (ADMIN_EMAIL). */
export async function isPlatformAdmin(): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return false;
  const user = await currentUser();
  const emails = user?.emailAddresses?.map((e) => e.emailAddress.toLowerCase()) ?? [];
  return emails.includes(adminEmail.toLowerCase());
}
