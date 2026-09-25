import { humanize } from "@/lib/utils";

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Created",
  UPDATE: "Updated",
  DELETE: "Deleted",
  EVALUATE: "Screening pipeline evaluated application",
  RE_EVALUATE: "Application re-evaluated under current policy",
  REVIEW_APPROVE: "Reviewer approved determination",
  REVIEW_DENY: "Reviewer denied application",
  REVIEW_ESCALATE: "Reviewer escalated determination",
  REVIEW_REQUEST_INFO: "Reviewer requested additional information",
  OVERRIDE: "Determination overridden with written justification",
  INDIVIDUALIZED_ASSESSMENT: "Individualized assessment completed",
  CHALLENGE_SUBMITTED: "Applicant challenge filed",
  CHALLENGE_SUSTAINED: "Applicant challenge sustained",
  CHALLENGE_DENIED: "Applicant challenge denied",
  ACCOMMODATION_REQUESTED: "Reasonable accommodation requested",
  ACCOMMODATION_GRANTED: "Reasonable accommodation granted",
  ACCOMMODATION_DENIED: "Reasonable accommodation denied",
  NOTICE_GENERATED: "Adverse-action notice generated",
  NOTICE_DELIVERED: "Notice delivered to applicant",
  POLICY_DRAFTED: "Screening policy version drafted",
  POLICY_PUBLISHED: "Screening policy published",
  FAIRNESS_ANALYSIS: "Disparate-impact analysis run",
  BURDEN_SHIFTING_ANALYSIS: "Burden-shifting analysis recorded",
  DRIFT_DETECTION: "Drift detection run",
  ALERT_ACKNOWLEDGED: "Monitoring alert acknowledged",
  ALERT_RESOLVED: "Monitoring alert resolved",
  PROXY_DETECTION: "Proxy-risk detection run",
  AIA_GENERATED: "Algorithmic impact assessment generated",
  COMPLIANCE_MODE_CHANGED: "Governing legal standard changed",
  INGEST: "Vendor screening records ingested",
  IDENTITY_RESOLUTION: "Identity resolution completed",
  RELEVANCE_LABELING: "Relevance-to-tenancy labeling completed",
  RELEVANCE_OVERRIDE: "Relevance label overridden",
  QUARANTINE: "Record quarantined",
  ACCESS_REQUESTED: "Full access requested",
  SAMPLE_DATA_LOADED: "Sample portfolio loaded",
};

export function describeAuditAction(action: string, tableName?: string): string {
  const label = ACTION_LABELS[action];
  if (label && !["CREATE", "UPDATE", "DELETE"].includes(action)) return label;
  const verb = label ?? humanize(action);
  return tableName ? `${verb} ${humanize(tableName).toLowerCase()}` : verb;
}

export function auditActionTone(action: string): "success" | "danger" | "warning" | "info" | "brand" | "neutral" {
  if (/APPROVE|GRANTED|SUSTAINED|RESOLVED|PUBLISHED/.test(action)) return "success";
  if (/DENY|DENIED|OVERRIDE|QUARANTINE/.test(action)) return "danger";
  if (/CHALLENGE|ACCOMMODATION|ESCALATE|REQUEST|ALERT/.test(action)) return "warning";
  if (/EVALUATE|ANALYSIS|DETECTION|ASSESSMENT|AIA/.test(action)) return "info";
  if (/NOTICE|POLICY|COMPLIANCE/.test(action)) return "brand";
  return "neutral";
}
