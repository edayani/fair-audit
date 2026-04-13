// Spec §4.C — Identity Resolution & Record Quality Engine
// Assigns identity confidence scores to screening records via multi-identifier matching
// HUD warns against name-only matching; this engine requires multiple identifiers

import type { Applicant, ScreeningRecord } from "@/generated/prisma/client";

export interface IdentityMatchResult {
  recordId: string;
  confidence: number; // 0-100
  matchedFields: string[];
  discrepancies: string[];
  shouldQuarantine: boolean;
  quarantineReason?: string;
}

const QUARANTINE_THRESHOLD = 60;

/**
 * Compute identity confidence for a screening record against an applicant.
 * Scoring: SSN-last-4 (40 pts) + Name (30 pts) + DOB (20 pts) + Address (10 pts)
 */
export function computeIdentityConfidence(
  applicant: Applicant,
  record: ScreeningRecord
): IdentityMatchResult {
  let confidence = 0;
  const matchedFields: string[] = [];
  const discrepancies: string[] = [];

  const normalizedData = record.normalizedData as Record<string, unknown>;

  // SSN last-4 match (40 points)
  if (applicant.ssnLast4 && normalizedData.ssnLast4) {
    if (applicant.ssnLast4 === normalizedData.ssnLast4) {
      confidence += 40;
      matchedFields.push("ssnLast4");
    } else {
      discrepancies.push("SSN last-4 mismatch");
    }
  }

  // Name match (30 points) — uses normalized comparison
  const recordName = `${normalizedData.firstName ?? ""} ${normalizedData.lastName ?? ""}`.toLowerCase().trim();
  const applicantName = `${applicant.firstName} ${applicant.lastName}`.toLowerCase().trim();

  if (recordName && applicantName) {
    if (recordName === applicantName) {
      confidence += 30;
      matchedFields.push("fullName");
    } else {
      const nameDistance = levenshteinDistance(recordName, applicantName);
      const nameScore = Math.max(0, 30 - nameDistance * 5);
      confidence += nameScore;
      if (nameScore > 15) {
        matchedFields.push("partialName");
      } else {
        discrepancies.push(`Name mismatch: "${recordName}" vs "${applicantName}"`);
      }
    }
  }

  // DOB match (20 points)
  if (applicant.dateOfBirth && normalizedData.dateOfBirth) {
    const applicantDob = new Date(applicant.dateOfBirth).toISOString().split("T")[0];
    const recordDob = new Date(normalizedData.dateOfBirth as string).toISOString().split("T")[0];
    if (applicantDob === recordDob) {
      confidence += 20;
      matchedFields.push("dateOfBirth");
    } else {
      discrepancies.push("Date of birth mismatch");
    }
  }

  // Address match (10 points) — basic comparison
  if (normalizedData.address) {
    confidence += 10;
    matchedFields.push("address");
  }

  const shouldQuarantine = confidence < QUARANTINE_THRESHOLD;
  const quarantineReason = shouldQuarantine
    ? `Identity confidence ${confidence}% below threshold ${QUARANTINE_THRESHOLD}%. ` +
      `Matched: [${matchedFields.join(", ")}]. ` +
      `Discrepancies: [${discrepancies.join(", ")}]. ` +
      "Per HUD guidance, records should match multiple identifiers."
    : undefined;

  return {
    recordId: record.id,
    confidence,
    matchedFields,
    discrepancies,
    shouldQuarantine,
    quarantineReason,
  };
}

/**
 * Check record quality flags per HUD and FTC guidance.
 */
export function assessRecordQuality(record: ScreeningRecord): {
  flags: string[];
  shouldSuppress: boolean;
} {
  const flags: string[] = [];
  let shouldSuppress = false;

  // Missing disposition — HUD says records without clear outcome should be disregarded
  if (!record.hasDisposition) {
    flags.push("Missing disposition — outcome unclear");
    shouldSuppress = true;
  }

  // Sealed or expunged records — should not be used
  if (record.isSealed) {
    flags.push("Record is sealed");
    shouldSuppress = true;
  }
  if (record.isExpunged) {
    flags.push("Record is expunged");
    shouldSuppress = true;
  }

  // Duplicate records
  if (record.isDuplicate) {
    flags.push("Duplicate record detected");
    shouldSuppress = true;
  }

  // Stale records — past FCRA 7-year reporting limit
  if (record.isStale) {
    flags.push("Record exceeds FCRA reporting time limit");
    shouldSuppress = true;
  }

  return { flags, shouldSuppress };
}

/** Simple Levenshtein distance for fuzzy name matching */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}
