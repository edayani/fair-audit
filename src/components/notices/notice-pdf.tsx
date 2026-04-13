"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";
import { Download } from "lucide-react";

interface NoticeContent {
  applicantName: string;
  applicantEmail?: string | null;
  propertyName: string;
  propertyAddress: string;
  decisionDate?: string;
  outcome?: string;
  reasonCodes: Array<{
    code: string;
    category: string;
    shortText: string;
    detailedText: string;
  }>;
  applicantRights: {
    freeReportRight: string;
    disputeRight: string;
    reportingAgencyNotice: string;
  };
  generatedAt: string;
  noticeType: string;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 72, // 1 inch margins
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 24,
  },
  propertyName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  propertyAddress: {
    fontSize: 10,
    color: "#444444",
    marginBottom: 4,
  },
  date: {
    fontSize: 10,
    color: "#444444",
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 24,
    textDecoration: "underline",
  },
  greeting: {
    marginBottom: 12,
  },
  bodyText: {
    marginBottom: 12,
    textAlign: "justify",
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 16,
    marginBottom: 8,
  },
  reasonTable: {
    marginBottom: 16,
  },
  reasonRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
    paddingVertical: 6,
  },
  reasonHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#333333",
    paddingVertical: 6,
    backgroundColor: "#f5f5f5",
  },
  reasonColNum: {
    width: 30,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  reasonColCode: {
    width: 60,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  reasonColShort: {
    width: 140,
    fontSize: 9,
  },
  reasonColDetail: {
    flex: 1,
    fontSize: 9,
  },
  reasonColNumHeader: {
    width: 30,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  reasonColCodeHeader: {
    width: 60,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  reasonColShortHeader: {
    width: 140,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  reasonColDetailHeader: {
    flex: 1,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  craSection: {
    marginTop: 16,
    marginBottom: 12,
  },
  craText: {
    fontSize: 9,
    marginBottom: 2,
  },
  rightsBox: {
    backgroundColor: "#f7f7f7",
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 4,
    padding: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  rightsTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  rightItem: {
    fontSize: 9,
    marginBottom: 6,
    paddingLeft: 8,
  },
  rightBullet: {
    fontFamily: "Helvetica-Bold",
  },
  signatureArea: {
    marginTop: 32,
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#333333",
    width: 200,
    marginTop: 40,
    paddingTop: 4,
    fontSize: 9,
  },
  dateLine: {
    borderTopWidth: 1,
    borderTopColor: "#333333",
    width: 120,
    marginTop: 16,
    paddingTop: 4,
    fontSize: 9,
  },
  footer: {
    position: "absolute",
    bottom: 36,
    left: 72,
    right: 72,
    textAlign: "center",
    fontSize: 7,
    color: "#888888",
    borderTopWidth: 1,
    borderTopColor: "#dddddd",
    paddingTop: 8,
  },
});

function formatOutcome(outcome?: string): string {
  switch (outcome) {
    case "DENIED":
      return "denied";
    case "CONDITIONAL":
      return "conditionally approved";
    case "APPROVED":
      return "approved";
    default:
      return "subject to adverse action";
  }
}

function formatNoticeDate(dateStr?: string): string {
  if (!dateStr) return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function NoticePDFDocument({ content }: { content: NoticeContent }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.propertyName}>{content.propertyName}</Text>
          <Text style={styles.propertyAddress}>{content.propertyAddress}</Text>
          <Text style={styles.date}>{formatNoticeDate(content.generatedAt)}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>NOTICE OF ADVERSE ACTION</Text>

        {/* Recipient greeting */}
        <Text style={styles.greeting}>Dear {content.applicantName},</Text>

        {/* Body paragraph */}
        <Text style={styles.bodyText}>
          This notice is to inform you that your application for housing at{" "}
          {content.propertyName}, located at {content.propertyAddress}, has been{" "}
          {formatOutcome(content.outcome)} based on information obtained from a
          consumer report.
        </Text>

        {/* Reason Codes Section */}
        <Text style={styles.sectionHeader}>
          Principal Reason(s) for This Decision:
        </Text>
        <View style={styles.reasonTable}>
          {/* Table header */}
          <View style={styles.reasonHeaderRow}>
            <Text style={styles.reasonColNumHeader}>#</Text>
            <Text style={styles.reasonColCodeHeader}>Code</Text>
            <Text style={styles.reasonColShortHeader}>Reason</Text>
            <Text style={styles.reasonColDetailHeader}>Details</Text>
          </View>
          {/* Table rows */}
          {content.reasonCodes.map((rc, idx) => (
            <View key={idx} style={styles.reasonRow}>
              <Text style={styles.reasonColNum}>{idx + 1}</Text>
              <Text style={styles.reasonColCode}>{rc.code}</Text>
              <Text style={styles.reasonColShort}>{rc.shortText}</Text>
              <Text style={styles.reasonColDetail}>{rc.detailedText}</Text>
            </View>
          ))}
        </View>

        {/* Consumer Reporting Agency Information */}
        <Text style={styles.sectionHeader}>
          Consumer Reporting Agency Information:
        </Text>
        <View style={styles.craSection}>
          <Text style={styles.craText}>
            Name: FairAudit Screening Services
          </Text>
          <Text style={styles.craText}>
            Address: Contact your property manager for CRA details
          </Text>
          <Text style={styles.craText}>Phone: See notice for details</Text>
          <Text style={{ ...styles.craText, marginTop: 8, fontStyle: "italic" }}>
            The consumer reporting agency noted above did not make this decision
            and is unable to explain why the decision was made.
          </Text>
        </View>

        {/* FCRA Rights Box */}
        <View style={styles.rightsBox}>
          <Text style={styles.rightsTitle}>
            Your Rights Under Federal Law (FCRA):
          </Text>
          <Text style={styles.rightItem}>
            {"\u2022"} Right to a Free Copy: You have the right to obtain a free
            copy of your consumer report from the consumer reporting agency named
            above within 60 days of receiving this notice.
          </Text>
          <Text style={styles.rightItem}>
            {"\u2022"} Right to Dispute: You have the right to dispute the
            accuracy or completeness of any information in your consumer report
            directly with the consumer reporting agency.
          </Text>
          <Text style={styles.rightItem}>
            {"\u2022"} Right to Your Report: You have the right to request a
            copy of your consumer report from the reporting agency listed above.
          </Text>
          <Text style={styles.rightItem}>
            {"\u2022"} Right to Know: You have the right to know what is in your
            file at the consumer reporting agency.
          </Text>
        </View>

        {/* Additional State Rights */}
        <View style={styles.rightsBox}>
          <Text style={styles.rightsTitle}>
            Additional State Rights (California):
          </Text>
          <Text style={styles.rightItem}>
            {"\u2022"} Under California law (Cal. Civ. Code Section 1785.20),
            you may request a copy of your consumer file from any consumer
            reporting agency. You are entitled to one free report per year, and
            additional free reports if adverse action has been taken against you.
          </Text>
          <Text style={styles.rightItem}>
            {"\u2022"} You have the right to place a security freeze on your
            consumer report by contacting the consumer reporting agency.
          </Text>
        </View>

        {/* Signature area */}
        <View style={styles.signatureArea}>
          <View style={styles.dateLine}>
            <Text>Date</Text>
          </View>
          <View style={styles.signatureLine}>
            <Text>Property Manager Signature</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          This notice is provided in compliance with the Fair Credit Reporting
          Act, 15 U.S.C. {"\u00A7"} 1681 et seq.
        </Text>
      </Page>
    </Document>
  );
}

export function NoticePDFDownloadButton({
  notice,
}: {
  notice: NoticeContent;
}) {
  return (
    <PDFDownloadLink
      document={<NoticePDFDocument content={notice} />}
      fileName={`notice-${notice.noticeType}.pdf`}
    >
      {({ loading }) => (
        <button className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
          <Download className="h-3.5 w-3.5" />
          {loading ? "Generating..." : "Download PDF"}
        </button>
      )}
    </PDFDownloadLink>
  );
}
