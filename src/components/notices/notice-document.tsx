// PDF rendering for adverse-action and related notices (Spec §4.J).
// Loaded on demand from NoticeActions so @react-pdf/renderer stays out of the main bundle.
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export interface NoticeContent {
  applicantName: string;
  applicantEmail?: string | null;
  propertyName: string;
  propertyAddress: string;
  decisionDate?: string;
  outcome?: string;
  reasonCodes?: Array<{ code: string; category: string; shortText: string; detailedText: string }>;
  applicantRights?: {
    freeReportRight?: string;
    disputeRight?: string;
    reportingAgencyNotice?: string;
    fairHousingNotice?: string;
  };
  consumerReportingAgencies?: string[];
  generatedAt: string;
  noticeType: string;
}

const INK = "#161d2e";
const MUTED = "#5b6478";
const RULE = "#d9dee8";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: INK, paddingTop: 56, paddingBottom: 72, paddingHorizontal: 64, lineHeight: 1.5 },
  letterhead: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 2, borderBottomColor: INK, paddingBottom: 10, marginBottom: 22 },
  property: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  small: { fontSize: 9, color: MUTED },
  title: { fontSize: 15, fontFamily: "Times-Bold", marginBottom: 4 },
  subtitle: { fontSize: 9, color: MUTED, marginBottom: 18 },
  p: { marginBottom: 10, textAlign: "justify" },
  h: { fontSize: 10.5, fontFamily: "Helvetica-Bold", marginTop: 14, marginBottom: 6 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: RULE, paddingVertical: 6 },
  head: { flexDirection: "row", borderBottomWidth: 1.5, borderBottomColor: INK, paddingVertical: 5 },
  cNum: { width: 22, fontSize: 9, fontFamily: "Helvetica-Bold" },
  cCode: { width: 54, fontSize: 9, fontFamily: "Helvetica-Bold" },
  cReason: { width: 150, fontSize: 9, paddingRight: 8 },
  cDetail: { flex: 1, fontSize: 9, color: "#2f3748" },
  box: { borderWidth: 1, borderColor: RULE, backgroundColor: "#f6f7fb", borderRadius: 4, padding: 12, marginTop: 12 },
  boxTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  bullet: { fontSize: 9, marginBottom: 5, paddingLeft: 8 },
  sigRow: { flexDirection: "row", gap: 40, marginTop: 36 },
  sig: { borderTopWidth: 1, borderTopColor: INK, paddingTop: 4, fontSize: 8.5, color: MUTED, width: 200 },
  footer: { position: "absolute", bottom: 32, left: 64, right: 64, borderTopWidth: 1, borderTopColor: RULE, paddingTop: 6, fontSize: 7, color: "#8a92a3", textAlign: "center" },
});

const TITLES: Record<string, string> = {
  ADVERSE_ACTION: "Notice of Adverse Action",
  PRE_ADVERSE: "Pre-Adverse Action Notice",
  CONDITIONAL_APPROVAL: "Notice of Conditional Approval",
  CORRECTION: "Notice of Corrected Determination",
  REQUEST_INFO: "Request for Additional Information",
};

function outcomePhrase(outcome?: string) {
  switch (outcome) {
    case "DENIED":
      return "denied";
    case "CONDITIONAL":
      return "approved subject to conditions";
    case "APPROVED":
      return "approved";
    default:
      return "the subject of an adverse determination";
  }
}

function longDate(value?: string) {
  const d = value ? new Date(value) : new Date();
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function NoticePDFDocument({ content }: { content: NoticeContent }) {
  const reasons = content.reasonCodes ?? [];
  const agencies = content.consumerReportingAgencies?.length ? content.consumerReportingAgencies : null;
  const isCalifornia = /\bCA\b|California/.test(content.propertyAddress ?? "");

  return (
    <Document title={`${TITLES[content.noticeType] ?? "Notice"} — ${content.applicantName}`} author="FairAudit">
      <Page size="LETTER" style={styles.page}>
        <View style={styles.letterhead}>
          <View>
            <Text style={styles.property}>{content.propertyName}</Text>
            <Text style={styles.small}>{content.propertyAddress}</Text>
          </View>
          <View>
            <Text style={styles.small}>{longDate(content.generatedAt)}</Text>
          </View>
        </View>

        <Text style={styles.title}>{TITLES[content.noticeType] ?? "Notice"}</Text>
        <Text style={styles.subtitle}>Provided pursuant to the Fair Credit Reporting Act, 15 U.S.C. § 1681m(a)</Text>

        <Text style={styles.p}>Dear {content.applicantName},</Text>
        <Text style={styles.p}>
          Thank you for applying for housing at {content.propertyName}. After review of your application, your application
          has been {outcomePhrase(content.outcome)}. This determination was based in whole or in part on information
          contained in a consumer report. The principal reasons are listed below so that you can understand the basis for
          the decision and respond to it.
        </Text>

        {reasons.length > 0 && (
          <>
            <Text style={styles.h}>Principal reasons for this determination</Text>
            <View style={styles.head}>
              <Text style={styles.cNum}>#</Text>
              <Text style={styles.cCode}>Code</Text>
              <Text style={styles.cReason}>Reason</Text>
              <Text style={styles.cDetail}>Explanation</Text>
            </View>
            {reasons.map((rc, i) => (
              <View key={`${rc.code}-${i}`} style={styles.row} wrap={false}>
                <Text style={styles.cNum}>{i + 1}</Text>
                <Text style={styles.cCode}>{rc.code}</Text>
                <Text style={styles.cReason}>{rc.shortText}</Text>
                <Text style={styles.cDetail}>{rc.detailedText}</Text>
              </View>
            ))}
          </>
        )}

        <Text style={styles.h}>Consumer reporting agency information</Text>
        <Text style={styles.p}>
          {agencies
            ? `The consumer report(s) were furnished by: ${agencies.join(", ")}.`
            : "The consumer reporting agency that furnished the report is identified in the enclosed agency disclosure."}{" "}
          {content.applicantRights?.reportingAgencyNotice ??
            "The consumer reporting agency did not make this decision and is unable to provide you with the specific reasons why it was made."}
        </Text>

        <View style={styles.box} wrap={false}>
          <Text style={styles.boxTitle}>Your rights under the Fair Credit Reporting Act</Text>
          <Text style={styles.bullet}>
            • {content.applicantRights?.freeReportRight ??
              "You have the right to obtain a free copy of your consumer report from the consumer reporting agency if you request it within 60 days of receiving this notice."}
          </Text>
          <Text style={styles.bullet}>
            • {content.applicantRights?.disputeRight ??
              "You have the right to dispute directly with the consumer reporting agency the accuracy or completeness of any information in your report."}
          </Text>
        </View>

        <View style={styles.box} wrap={false}>
          <Text style={styles.boxTitle}>Your fair housing rights</Text>
          <Text style={styles.bullet}>
            • You may submit information showing that a record is inaccurate, is not relevant to tenancy, or is mitigated by
            later circumstances, and you may ask that the decision be reconsidered.
          </Text>
          <Text style={styles.bullet}>
            • If you have a disability, you may request a reasonable accommodation in rules, policies, practices, or services
            (42 U.S.C. § 3604(f)(3)(B)).
          </Text>
          <Text style={styles.bullet}>
            • {content.applicantRights?.fairHousingNotice ??
              "If you believe you have experienced housing discrimination, you may contact HUD's Office of Fair Housing and Equal Opportunity at 1-800-669-9777."}
          </Text>
          {isCalifornia && (
            <Text style={styles.bullet}>
              • California residents may also file a complaint with the California Civil Rights Department (calcivilrights.ca.gov)
              and may request consumer file disclosures under Cal. Civ. Code § 1785.10.
            </Text>
          )}
        </View>

        <View style={styles.sigRow}>
          <Text style={styles.sig}>Authorized representative</Text>
          <Text style={{ ...styles.sig, width: 120 }}>Date</Text>
        </View>

        <Text style={styles.footer} fixed>
          Generated by FairAudit · Retain a copy of this notice with the application file · This notice does not constitute legal advice.
        </Text>
      </Page>
    </Document>
  );
}
