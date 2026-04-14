"use server";

import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

function isAdmin(email: string | null | undefined): boolean {
  if (!ADMIN_EMAIL || !email) return false;
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/**
 * Submit an access request for the current org.
 */
export async function submitAccessRequest(reason: string): Promise<ActionResult> {
  const { orgId, userId, userEmail } = await getAuthContext();

  // Check if already has full access
  const org = await prisma.organization.findFirst({
    where: { id: orgId },
    select: { accessTier: true },
  });
  if (org?.accessTier === "FULL") {
    return { success: false, error: "You already have full access." };
  }

  // Check for existing pending request
  const existing = await prisma.accessRequest.findFirst({
    where: { organizationId: orgId, status: "PENDING" },
  });
  if (existing) {
    return { success: false, error: "You already have a pending access request." };
  }

  await prisma.accessRequest.create({
    data: {
      organizationId: orgId,
      requestedBy: userId,
      email: userEmail ?? "unknown",
      reason: reason || null,
    },
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}

/**
 * Get the current org's access request status.
 */
export async function getAccessRequestStatus() {
  const { orgId, accessTier } = await getAuthContext();

  const pendingRequest = await prisma.accessRequest.findFirst({
    where: { organizationId: orgId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  return {
    accessTier,
    hasPendingRequest: !!pendingRequest,
    requestedAt: pendingRequest?.createdAt ?? null,
  };
}

// ============================================================
// Admin-only actions
// ============================================================

async function requireAdmin() {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!isAdmin(email)) {
    throw new Error("Unauthorized: admin access required.");
  }
}

/**
 * Get all access requests (admin only).
 */
export async function getAllAccessRequests() {
  await requireAdmin();

  return prisma.accessRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      organization: {
        select: { id: true, name: true, accessTier: true },
      },
    },
  });
}

/**
 * Get all signed up users with their organization and access context (admin only).
 */
export async function getAllSignedUpUsers() {
  await requireAdmin();

  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          accessTier: true,
          accessRequests: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              status: true,
              createdAt: true,
              respondedAt: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Approve an access request (admin only).
 */
export async function approveAccessRequest(requestId: string): Promise<ActionResult> {
  await requireAdmin();

  const request = await prisma.accessRequest.findFirstOrThrow({
    where: { id: requestId },
  });

  await prisma.$transaction([
    prisma.accessRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED", respondedAt: new Date() },
    }),
    prisma.organization.update({
      where: { id: request.organizationId },
      data: { accessTier: "FULL" },
    }),
  ]);

  revalidatePath("/admin/requests");
  return { success: true };
}

/**
 * Deny an access request (admin only).
 */
export async function denyAccessRequest(requestId: string): Promise<ActionResult> {
  await requireAdmin();

  await prisma.accessRequest.update({
    where: { id: requestId },
    data: { status: "DENIED", respondedAt: new Date() },
  });

  revalidatePath("/admin/requests");
  return { success: true };
}
