"use server";

// Spec §4.J — Adverse-Action & Notice Generator Server Actions
import { prisma } from "@/lib/prisma";
import { getAuthContext, requireFullAccess } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { preserveEvidence, recordAudit } from "@/lib/audit";
import type { ActionResult } from "@/types";

export async function generateNotice(
  applicationId: string,
  type: "PRE_ADVERSE" | "ADVERSE_ACTION" | "CONDITIONAL_APPROVAL" | "CORRECTION" | "REQUEST_INFO"
): Promise<ActionResult<{ id: string }>> {
  const denied = await requireFullAccess();
  if (denied) return denied;
  const { orgId } = await getAuthContext();

  const application = await prisma.application.findFirst({
    where: { id: applicationId, organizationId: orgId },
    include: {
      applicant: true,
      property: true,
      decision: { include: { reasonCodes: { orderBy: { sortOrder: "asc" } } } },
      screeningRecords: { select: { vendorName: true }, distinct: ["vendorName"] },
    },
  });
  if (!application) return { success: false, error: "Application not found" };

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
    // FCRA § 615(a), 15 U.S.C. § 1681m(a) — required adverse-action disclosures
    applicantRights: {
      freeReportRight:
        "You have the right to obtain a free copy of your consumer report from the consumer reporting agency identified in this notice if you request it within 60 days of receiving this notice.",
      disputeRight:
        "You have the right to dispute directly with the consumer reporting agency the accuracy or completeness of any information in the report it furnished.",
      reportingAgencyNotice:
        "The consumer reporting agency did not make this decision and is unable to provide you with the specific reasons why it was made.",
      fairHousingNotice:
        "You may request a reasonable accommodation, submit mitigating information, or challenge the accuracy or relevance of any record considered. If you believe you have experienced housing discrimination, you may contact HUD's Office of Fair Housing and Equal Opportunity at 1-800-669-9777.",
    },
    consumerReportingAgencies: application.screeningRecords.map((r) => r.vendorName),
    generatedAt: new Date().toISOString(),
    noticeType: type,
  };

  const craName = application.screeningRecords.map((r) => r.vendorName).join(", ") || null;

  const notice = await prisma.notice.create({
    data: {
      applicationId,
      type,
      content,
      craName,
      craAddress: "Contact information for each consumer reporting agency is listed in the notice.",
      craPhone: null,
    },
  });

  await recordAudit({
    tableName: "Notice",
    recordId: notice.id,
    action: "NOTICE_GENERATED",
    after: { type, reasonCodes: content.reasonCodes.map((rc) => rc.code) },
    metadata: { applicationId },
  });
  await preserveEvidence({
    entityType: "notice",
    entityId: notice.id,
    documentType: `${type.toLowerCase()}_notice`,
    content,
    description: `${type.replace(/_/g, " ").toLowerCase()} notice for ${content.applicantName}`,
  });

  revalidatePath(`/dashboard/applications/${applicationId}`, "layout");
  return { success: true, data: { id: notice.id } };
}

export async function getNotices(applicationId: string) {
  const { orgId } = await getAuthContext();
  return prisma.notice.findMany({
    where: { applicationId, application: { organizationId: orgId } },
    orderBy: { createdAt: "desc" },
  });
}

export async function markNoticeSent(
  noticeId: string,
  method: string
): Promise<ActionResult> {
  const denied = await requireFullAccess();
  if (denied) return denied;
  const { orgId } = await getAuthContext();

  const notice = await prisma.notice.findFirst({
    where: { id: noticeId, application: { organizationId: orgId } },
  });
  if (!notice) return { success: false, error: "Notice not found" };

  await prisma.notice.update({
    where: { id: noticeId },
    data: { sentAt: new Date(), sentMethod: method },
  });

  await recordAudit({
    tableName: "Notice",
    recordId: noticeId,
    action: "NOTICE_DELIVERED",
    after: { sentMethod: method },
    metadata: { applicationId: notice.applicationId },
  });

  revalidatePath(`/dashboard/applications/${notice.applicationId}`, "layout");
  return { success: true };
}
