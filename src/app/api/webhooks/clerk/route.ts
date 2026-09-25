import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { prisma } from "@/lib/prisma";

// Clerk webhook to sync organization and user data.
// Requests are verified with the Svix signature (CLERK_WEBHOOK_SIGNING_SECRET);
// unsigned or forged requests are rejected before touching the database.
export async function POST(req: NextRequest) {
  if (!process.env.CLERK_WEBHOOK_SIGNING_SECRET) {
    return NextResponse.json({ error: "Webhook signing secret is not configured" }, { status: 503 });
  }

  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  try {
    switch (evt.type) {
      case "organization.created":
      case "organization.updated": {
        const { id, name } = evt.data;
        await prisma.organization.upsert({
          where: { clerkOrgId: id },
          create: { clerkOrgId: id, name: name || "Organization" },
          update: { name: name || "Organization" },
        });
        break;
      }

      case "organizationMembership.created": {
        const { organization, public_user_data } = evt.data;
        if (organization?.id && public_user_data?.user_id) {
          const org = await prisma.organization.upsert({
            where: { clerkOrgId: organization.id },
            create: { clerkOrgId: organization.id, name: organization.name || "Organization" },
            update: {},
          });
          await prisma.user.upsert({
            where: { clerkUserId: public_user_data.user_id },
            create: {
              clerkUserId: public_user_data.user_id,
              email: public_user_data.identifier ?? "",
              name: `${public_user_data.first_name ?? ""} ${public_user_data.last_name ?? ""}`.trim() || null,
              organizationId: org.id,
            },
            update: { organizationId: org.id },
          });
        }
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Clerk webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
