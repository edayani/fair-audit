"use server";

// Spec §4.J — Adverse-Action & Notice Generator Server Actions
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

export async function generateNotice(
  applicationId: string,
  type: "PRE_ADVERSE" | "ADVERSE_ACTION" | "CONDITIONAL_APPROVAL" | "CORRECTION" | "REQUEST_INFO"
): Promise<ActionResult<{ id: string }>> {
  const { orgId } = await getAuthContext();

  const application = await prisma.application.findFirstOrThrow({
    where: { id: applicationId, organizationId: orgId },
    include: {
      applicant: true,
      property: true,
      decision: { include: { reasonCodes: true } },
    },
  });

  if (!application.decision && type !== "REQUEST_INFO") {
    return { success: false, error: "No decision exists for this application" };
  }

  // Build notice content
  const content = {
    applicantName: `${application.applicant.firstName} ${application.applicant.lastName}`,
    applicantEmail: application.applicant.email,
    propertyName: application.property.name,
    propertyAddress: [application.property.address, application.property.city, application.property.state]
      .filter(Boolean).join(", "),
    decisionDate: application.decision?.decidedAt?.toISOString(),
    outcome: application.decision?.outcome,
    reasonCodes: application.decision?.reasonCodes.map((rc) => ({
      code: rc.code,
      category: rc.category,
      shortText: rc.shortText,
      detailedText: rc.detailedText,
    })) ?? [],
    // FCRA required information
    applicantRights: {
      freeReportRight: "You have the right to obtain a free copy of your consumer report within 60 days.",
      disputeRight: "You have the right to dispute the accuracy or completeness of any information in your report.",
      reportingAgencyNotice: "The reporting agency did not make the adverse decision and cannot explain why it was made.",
    },
    generatedAt: new Date().toISOString(),
    noticeType: type,
  };

  const notice = await prisma.notice.create({
    data: {
      applicationId,
      type,
      content,
      craName: "FairAudit Screening Services",
      craAddress: "Contact your property manager for CRA details",
      craPhone: "See notice for details",
    },
  });

  revalidatePath(`/dashboard/applications/${applicationId}/notice`);
  return { success: true, data: { id: notice.id } };
}

export async function getNotices(applicationId: string) {
  const { orgId } = await getAuthContext();
  await prisma.application.findFirstOrThrow({
    where: { id: applicationId, organizationId: orgId },
  });

  return prisma.notice.findMany({
    where: { applicationId },
    orderBy: { createdAt: "desc" },
  });
}

export async function markNoticeSent(
  noticeId: string,
  method: string
): Promise<ActionResult> {
  const { orgId } = await getAuthContext();

  const notice = await prisma.notice.findFirstOrThrow({
    where: { id: noticeId },
    include: { application: true },
  });

  if (notice.application.organizationId !== orgId) {
    return { success: false, error: "Unauthorized" };
  }

  await prisma.notice.update({
    where: { id: noticeId },
    data: { sentAt: new Date(), sentMethod: method },
  });

  return { success: true };
}
