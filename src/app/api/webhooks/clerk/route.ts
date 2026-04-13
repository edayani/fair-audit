import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Clerk webhook to sync organization and user data
export async function POST(req: NextRequest) {
  const body = await req.json();
  const eventType = body.type;

  try {
    switch (eventType) {
      case "organization.created":
      case "organization.updated": {
        const { id, name } = body.data;
        await prisma.organization.upsert({
          where: { clerkOrgId: id },
          create: { clerkOrgId: id, name: name ?? "Organization" },
          update: { name: name ?? "Organization" },
        });
        break;
      }

      case "organizationMembership.created": {
        const { organization, public_user_data } = body.data;
        if (organization?.id && public_user_data?.user_id) {
          const org = await prisma.organization.findUnique({
            where: { clerkOrgId: organization.id },
          });
          if (org) {
            await prisma.user.upsert({
              where: { clerkUserId: public_user_data.user_id },
              create: {
                clerkUserId: public_user_data.user_id,
                email: public_user_data.identifier ?? "",
                name: `${public_user_data.first_name ?? ""} ${public_user_data.last_name ?? ""}`.trim(),
                organizationId: org.id,
              },
              update: { organizationId: org.id },
            });
          }
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
