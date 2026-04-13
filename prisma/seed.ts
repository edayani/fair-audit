import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { faker } from "@faker-js/faker";
import "dotenv/config";

import type {
  DecisionOutcome,
  ChallengeType,
  ChallengeStatus,
  RecordType,
  RelevanceLabel,
  CriterionType,
  Severity,
  NoticeType,
  DriftType,
  JurisdictionLevel,
} from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// California-specific realistic data
// ---------------------------------------------------------------------------

const CA_PROPERTIES = [
  {
    name: "Sunrise Gardens Apartments",
    address: "4521 El Camino Real",
    city: "Palo Alto",
    state: "CA",
    zipCode: "94306",
    unitCount: 48,
  },
  {
    name: "Bayside Terrace",
    address: "1200 Marina Boulevard",
    city: "San Francisco",
    state: "CA",
    zipCode: "94123",
    unitCount: 72,
  },
  {
    name: "Golden Oak Residences",
    address: "8910 Valley View Drive",
    city: "Sacramento",
    state: "CA",
    zipCode: "95823",
    unitCount: 36,
  },
];

const RACES = ["White", "Black", "Asian", "Hispanic", "Two or More Races", "Native American"];
const SEXES = ["Male", "Female", "Non-binary"];
const FAMILIAL_STATUSES = ["No children", "Has children under 18", "Pregnant", "Single parent"];

const VENDOR_NAMES = ["TransUnion", "Experian", "CoreLogic", "RealPage"];
const CRIMINAL_DISPOSITIONS = ["convicted", "dismissed", "nolle prosequi", "deferred adjudication", "acquitted", "pending"];
const EVICTION_DISPOSITIONS = ["judgment for plaintiff", "dismissed", "settled", "judgment for defendant"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function main() {
  console.log("Seeding FairAudit demo data...");

  // Create a default org (no Clerk context in standalone seed)
  const org = await prisma.organization.upsert({
    where: { clerkOrgId: "org_seed_demo" },
    update: {},
    create: {
      clerkOrgId: "org_seed_demo",
      name: "FairAudit Demo Organization",
    },
  });

  const organizationId = org.id;
  console.log(`Organization: ${org.name} (${org.id})`);

  // Clean existing data for this org (dependency order)
  await cleanOrganizationData(organizationId);

  // ------ Properties ------
  console.log("Creating properties...");
  const properties = await Promise.all(
    CA_PROPERTIES.map((p) =>
      prisma.property.create({
        data: { ...p, organizationId },
      })
    )
  );

  // ------ Screening Policies & Rules ------
  console.log("Creating screening policies and rules...");
  const policies = await Promise.all(
    properties.map(async (property) => {
      const policy = await prisma.screeningPolicy.create({
        data: {
          organizationId,
          propertyId: property.id,
          name: `${property.name} Standard Policy`,
          version: 1,
          isActive: true,
          publishedAt: new Date(),
        },
      });

      const rules: Array<{
        criterionType: CriterionType;
        label: string;
        description: string;
        operator: string;
        value: string;
        weight: number;
        isDisqualifying: boolean;
        lookbackMonths: number | null;
        mitigationAllowed: boolean;
        sortOrder: number;
      }> = [
        {
          criterionType: "CREDIT_SCORE",
          label: "Minimum Credit Score",
          description: "Applicant must have a credit score of 620 or above",
          operator: "GTE",
          value: "620",
          weight: 1.5,
          isDisqualifying: false,
          lookbackMonths: null,
          mitigationAllowed: true,
          sortOrder: 1,
        },
        {
          criterionType: "INCOME_REQUIREMENT",
          label: "Income-to-Rent Ratio",
          description: "Monthly income must be at least 2.5x monthly rent",
          operator: "GTE",
          value: "2.5",
          weight: 1.2,
          isDisqualifying: false,
          lookbackMonths: null,
          mitigationAllowed: true,
          sortOrder: 2,
        },
        {
          criterionType: "EVICTION_HISTORY",
          label: "No Recent Evictions",
          description: "No eviction judgments within the past 5 years",
          operator: "LOOKBACK_YEARS",
          value: "0",
          weight: 2.0,
          isDisqualifying: true,
          lookbackMonths: 60,
          mitigationAllowed: true,
          sortOrder: 3,
        },
        {
          criterionType: "CRIMINAL_HISTORY",
          label: "Criminal History Review",
          description:
            "Individualized assessment of criminal history per CA Fair Chance Act. Felony convictions within 7 years trigger review.",
          operator: "LOOKBACK_YEARS",
          value: "0",
          weight: 1.8,
          isDisqualifying: false,
          lookbackMonths: 84,
          mitigationAllowed: true,
          sortOrder: 4,
        },
        {
          criterionType: "RENTAL_HISTORY",
          label: "Positive Rental History",
          description: "At least 12 months of verifiable rental history with no landlord complaints",
          operator: "GTE",
          value: "12",
          weight: 1.0,
          isDisqualifying: false,
          lookbackMonths: 36,
          mitigationAllowed: true,
          sortOrder: 5,
        },
      ];

      await prisma.policyRule.createMany({
        data: rules.map((r) => ({ ...r, screeningPolicyId: policy.id })),
      });

      return policy;
    })
  );

  // ------ Applicants ------
  console.log("Creating 20 applicants...");
  const applicants = await Promise.all(
    Array.from({ length: 20 }, () => {
      const sex = pick(SEXES);
      const sexType = sex === "Male" ? "male" : "female";
      const firstName = faker.person.firstName(sexType as "male" | "female");
      const lastName = faker.person.lastName();
      const hasVoucher = Math.random() < 0.2;

      return prisma.applicant.create({
        data: {
          organizationId,
          firstName,
          lastName,
          email: faker.internet.email({ firstName, lastName }).toLowerCase(),
          phone: faker.phone.number({ style: "national" }),
          dateOfBirth: faker.date.birthdate({ min: 21, max: 65, mode: "age" }),
          ssnLast4: faker.string.numeric(4),
          race: pick(RACES),
          ethnicity: Math.random() < 0.3 ? "Hispanic or Latino" : "Not Hispanic or Latino",
          sex,
          familialStatus: pick(FAMILIAL_STATUSES),
          disability: Math.random() < 0.08 ? true : false,
          nationalOrigin: "United States",
          sourceOfIncome: hasVoucher
            ? pick(["Section 8 Voucher", "VASH Voucher"])
            : pick(["Employment", "Self-employment", "SSI/SSDI"]),
        },
      });
    })
  );

  // ------ Applications ------
  console.log("Creating 20 applications...");
  const applications = await Promise.all(
    applicants.map((applicant, idx) => {
      const property = properties[idx % properties.length];
      const monthlyIncome = faker.number.int({ min: 3000, max: 8000 });
      const hasVoucher = applicant.sourceOfIncome?.includes("Voucher") ?? false;

      return prisma.application.create({
        data: {
          organizationId,
          applicantId: applicant.id,
          propertyId: property.id,
          unitAppliedFor: `Unit ${faker.number.int({ min: 100, max: 499 })}`,
          monthlyIncome,
          hasVoucher,
          voucherType: hasVoucher ? applicant.sourceOfIncome : null,
          voucherAmount: hasVoucher ? faker.number.int({ min: 800, max: 1800 }) : null,
          status: "PENDING",
          submittedAt: faker.date.recent({ days: 30 }),
        },
      });
    })
  );

  // ------ Screening Records ------
  console.log("Creating screening records (~4 per application)...");
  const allRecords: Array<{ id: string; applicationId: string; recordType: RecordType }> = [];

  for (const application of applications) {
    const creditScore = faker.number.int({ min: 550, max: 780 });
    const recordConfigs: Array<{
      recordType: RecordType;
      vendor: string;
      summary: string;
      disposition: string | null;
      amount: number | null;
      dateOccurred: Date;
      rawData: Record<string, unknown>;
      normalizedData: Record<string, unknown>;
      relevance: RelevanceLabel;
      relevanceReason: string;
      hasDisposition: boolean;
      identityConfidence: number;
    }> = [
      {
        recordType: "CREDIT_REPORT",
        vendor: pick(["TransUnion", "Experian"]),
        summary: `Credit score: ${creditScore}. ${creditScore < 620 ? "Below threshold." : "Meets minimum requirement."} Total accounts: ${faker.number.int({ min: 3, max: 15 })}. Collections: ${faker.number.int({ min: 0, max: 3 })}.`,
        disposition: creditScore >= 620 ? "satisfactory" : "below threshold",
        amount: null,
        dateOccurred: faker.date.recent({ days: 7 }),
        rawData: {
          score: creditScore,
          bureau: "TransUnion",
          accounts: faker.number.int({ min: 3, max: 15 }),
          collections: faker.number.int({ min: 0, max: 3 }),
          latePay30: faker.number.int({ min: 0, max: 4 }),
          latePay60: faker.number.int({ min: 0, max: 2 }),
          bankruptcies: 0,
        },
        normalizedData: {
          creditScore,
          hasBankruptcy: false,
          collectionsCount: faker.number.int({ min: 0, max: 3 }),
          openAccounts: faker.number.int({ min: 2, max: 10 }),
        },
        relevance: "RELEVANT" as RelevanceLabel,
        relevanceReason: "Credit history is directly relevant to tenancy risk assessment",
        hasDisposition: true,
        identityConfidence: faker.number.float({ min: 92, max: 100, fractionDigits: 1 }),
      },
      {
        recordType: "CRIMINAL_HISTORY",
        vendor: pick(VENDOR_NAMES),
        summary:
          Math.random() < 0.3
            ? `${pick(["Misdemeanor", "Felony"])} - ${pick(["Theft", "DUI", "Drug possession", "Assault"])} (${pick(CRIMINAL_DISPOSITIONS)})`
            : "No criminal records found within lookback period.",
        disposition: Math.random() < 0.3 ? pick(CRIMINAL_DISPOSITIONS) : null,
        amount: null,
        dateOccurred: faker.date.past({ years: 5 }),
        rawData: {
          searchType: "national",
          jurisdictionsSearched: ["CA", "Federal"],
          recordsFound: Math.random() < 0.3 ? 1 : 0,
        },
        normalizedData: {
          hasRecords: Math.random() < 0.3,
          felonyCount: Math.random() < 0.15 ? 1 : 0,
          misdemeanorCount: Math.random() < 0.2 ? 1 : 0,
          oldestRecordYears: faker.number.int({ min: 1, max: 10 }),
        },
        relevance: Math.random() < 0.7 ? ("RELEVANT" as RelevanceLabel) : ("CONDITIONAL" as RelevanceLabel),
        relevanceReason: "Subject to individualized assessment per California Fair Chance Act AB 1008",
        hasDisposition: Math.random() < 0.7,
        identityConfidence: faker.number.float({ min: 85, max: 100, fractionDigits: 1 }),
      },
      {
        recordType: "EVICTION_HISTORY",
        vendor: "CoreLogic",
        summary:
          Math.random() < 0.2
            ? `Eviction filing found - ${pick(EVICTION_DISPOSITIONS)} in ${pick(["Los Angeles", "San Francisco", "Sacramento", "San Diego"])} County`
            : "No eviction records found.",
        disposition: Math.random() < 0.2 ? pick(EVICTION_DISPOSITIONS) : null,
        amount: Math.random() < 0.2 ? faker.number.int({ min: 1200, max: 8500 }) : null,
        dateOccurred: faker.date.past({ years: 5 }),
        rawData: {
          searchType: "statewide",
          state: "CA",
          recordsFound: Math.random() < 0.2 ? 1 : 0,
        },
        normalizedData: {
          hasEvictions: Math.random() < 0.2,
          evictionCount: Math.random() < 0.2 ? 1 : 0,
          mostRecentYears: faker.number.int({ min: 1, max: 7 }),
        },
        relevance: "RELEVANT" as RelevanceLabel,
        relevanceReason: "Eviction history within lookback period is relevant to tenancy assessment",
        hasDisposition: true,
        identityConfidence: faker.number.float({ min: 88, max: 100, fractionDigits: 1 }),
      },
      {
        recordType: "RENTAL_HISTORY",
        vendor: pick(VENDOR_NAMES),
        summary: `${faker.number.int({ min: 12, max: 72 })} months of rental history verified. ${Math.random() < 0.85 ? "No landlord complaints." : "1 landlord complaint on file."}`,
        disposition: Math.random() < 0.85 ? "satisfactory" : "unsatisfactory",
        amount: faker.number.int({ min: 1200, max: 3200 }),
        dateOccurred: faker.date.past({ years: 3 }),
        rawData: {
          totalMonths: faker.number.int({ min: 12, max: 72 }),
          previousAddresses: faker.number.int({ min: 1, max: 4 }),
          landlordComplaints: Math.random() < 0.85 ? 0 : 1,
          latePayments: faker.number.int({ min: 0, max: 5 }),
        },
        normalizedData: {
          monthsVerified: faker.number.int({ min: 12, max: 72 }),
          hasComplaints: Math.random() < 0.15,
          onTimePaymentPct: faker.number.float({ min: 0.8, max: 1.0, fractionDigits: 2 }),
        },
        relevance: "RELEVANT" as RelevanceLabel,
        relevanceReason: "Rental history is directly relevant to predicting tenancy outcomes",
        hasDisposition: true,
        identityConfidence: faker.number.float({ min: 90, max: 100, fractionDigits: 1 }),
      },
    ];

    for (const config of recordConfigs) {
      const record = await prisma.screeningRecord.create({
        data: {
          applicationId: application.id,
          vendorName: config.vendor,
          recordType: config.recordType,
          rawData: config.rawData as object,
          normalizedData: config.normalizedData as object,
          summary: config.summary,
          disposition: config.disposition,
          amount: config.amount,
          dateOccurred: config.dateOccurred,
          identityConfidence: config.identityConfidence,
          hasDisposition: config.hasDisposition,
          relevance: config.relevance,
          relevanceReason: config.relevanceReason,
        },
      });
      allRecords.push({ id: record.id, applicationId: application.id, recordType: config.recordType });
    }
  }

  // ------ Decisions (for first 12 applications) ------
  console.log("Creating decisions for 12 applications...");
  const outcomes: DecisionOutcome[] = [
    "APPROVED", "APPROVED", "APPROVED", "APPROVED", "APPROVED",
    "DENIED", "DENIED", "DENIED",
    "CONDITIONAL", "CONDITIONAL",
    "PENDING_REVIEW", "PENDING_REVIEW",
  ];

  const decisionApplications = applications.slice(0, 12);

  for (let i = 0; i < decisionApplications.length; i++) {
    const app = decisionApplications[i];
    const outcome = outcomes[i];
    const policyId = policies[i % policies.length].id;

    const policyRules = await prisma.policyRule.findMany({
      where: { screeningPolicyId: policyId },
    });

    const decision = await prisma.decision.create({
      data: {
        applicationId: app.id,
        screeningPolicyId: policyId,
        outcome,
        confidenceScore: faker.number.float({ min: 65, max: 98, fractionDigits: 1 }),
        isAutomatic: outcome !== "PENDING_REVIEW",
        evaluationData: {
          overallScore: faker.number.float({ min: 40, max: 95, fractionDigits: 1 }),
          evaluations: policyRules.map((rule) => ({
            ruleId: rule.id,
            criterionType: rule.criterionType,
            passed: outcome === "APPROVED" ? true : Math.random() > 0.4,
            score: faker.number.float({ min: 30, max: 100, fractionDigits: 1 }),
          })),
        },
      },
    });

    // Reason codes for non-approved decisions
    if (outcome === "DENIED" || outcome === "CONDITIONAL" || outcome === "PENDING_REVIEW") {
      const reasonCodeData: Array<{
        code: string;
        category: string;
        shortText: string;
        detailedText: string;
        severity: Severity;
        policyRuleId: string | null;
        sortOrder: number;
      }> = [];

      if (outcome === "DENIED") {
        const denyRule = policyRules.find(
          (r) => r.criterionType === "EVICTION_HISTORY" || r.criterionType === "CRIMINAL_HISTORY"
        );
        reasonCodeData.push({
          code: "CR-001",
          category: "Credit",
          shortText: "Credit score below threshold",
          detailedText:
            "Applicant's credit score falls below the minimum threshold of 620 established in the screening policy. This factor was weighted at 1.5x in the overall evaluation.",
          severity: "HIGH",
          policyRuleId: policyRules.find((r) => r.criterionType === "CREDIT_SCORE")?.id ?? null,
          sortOrder: 0,
        });
        if (denyRule) {
          reasonCodeData.push({
            code: denyRule.criterionType === "EVICTION_HISTORY" ? "EV-001" : "CH-001",
            category: denyRule.criterionType === "EVICTION_HISTORY" ? "Eviction" : "Criminal",
            shortText:
              denyRule.criterionType === "EVICTION_HISTORY"
                ? "Eviction judgment within lookback period"
                : "Criminal record within lookback period",
            detailedText:
              denyRule.criterionType === "EVICTION_HISTORY"
                ? "An eviction judgment was found within the 60-month lookback window. Under the screening policy, this is a disqualifying criterion subject to individualized review."
                : "A criminal conviction was found within the 84-month lookback window. Per California AB 1008, an individualized assessment was conducted considering the nature, time elapsed, and relevance to tenancy.",
            severity: "HIGH",
            policyRuleId: denyRule.id,
            sortOrder: 1,
          });
        }
      }

      if (outcome === "CONDITIONAL") {
        reasonCodeData.push({
          code: "IN-001",
          category: "Income",
          shortText: "Income does not meet ratio requirement",
          detailedText:
            "Applicant's verified monthly income does not meet the 2.5x rent requirement. A conditional approval may be granted with an increased security deposit or qualified co-signer.",
          severity: "MEDIUM",
          policyRuleId: policyRules.find((r) => r.criterionType === "INCOME_REQUIREMENT")?.id ?? null,
          sortOrder: 0,
        });
      }

      if (outcome === "PENDING_REVIEW") {
        reasonCodeData.push({
          code: "RV-001",
          category: "Review",
          shortText: "Individualized assessment required",
          detailedText:
            "One or more screening criteria require individualized review per California fair housing regulations. An assessor must review the full context before a final decision can be issued.",
          severity: "MEDIUM",
          policyRuleId: null,
          sortOrder: 0,
        });
      }

      await prisma.reasonCode.createMany({
        data: reasonCodeData.map((rc) => ({ ...rc, decisionId: decision.id })),
      });
    }

    // Update application status
    await prisma.application.update({
      where: { id: app.id },
      data: {
        status: outcome === "PENDING_REVIEW" ? "IN_REVIEW" : "DECIDED",
        decidedAt: outcome !== "PENDING_REVIEW" ? new Date() : null,
      },
    });
  }

  // ------ Challenges ------
  console.log("Creating challenges...");
  const challengeConfigs: Array<{
    appIndex: number;
    type: ChallengeType;
    status: ChallengeStatus;
    description: string;
  }> = [
    {
      appIndex: 5,
      type: "ACCURACY",
      status: "SUBMITTED",
      description:
        "The criminal record attributed to me belongs to another individual with a similar name. I have attached a certified court document showing my full legal name and date of birth do not match the record.",
    },
    {
      appIndex: 6,
      type: "RELEVANCE",
      status: "UNDER_REVIEW",
      description:
        "The misdemeanor drug possession charge from 2019 is not relevant to my ability to be a responsible tenant. Under California's Fair Chance Act, this type of offense should not be considered in housing decisions.",
    },
    {
      appIndex: 7,
      type: "MITIGATION",
      status: "RESOLVED_ACCEPTED",
      description:
        "The eviction filing from 2021 was due to domestic violence. I was forced to break my lease for safety reasons. I have documentation from a domestic violence shelter and a restraining order confirming the circumstances.",
    },
    {
      appIndex: 8,
      type: "ACCURACY",
      status: "RESOLVED_REJECTED",
      description:
        "I believe my credit score is reported incorrectly. However, I was unable to provide documentation from the credit bureau supporting a different score.",
    },
  ];

  for (const config of challengeConfigs) {
    const app = applications[config.appIndex];
    const appRecords = allRecords.filter((r) => r.applicationId === app.id);

    await prisma.challenge.create({
      data: {
        applicationId: app.id,
        type: config.type,
        status: config.status,
        description: config.description,
        recordIds: appRecords.slice(0, 2).map((r) => r.id),
        circumstanceType: config.type === "MITIGATION" ? "domestic_violence" : null,
        mitigatingEvidence:
          config.type === "MITIGATION"
            ? "Domestic violence shelter documentation and restraining order from Los Angeles Superior Court."
            : null,
        resolution: config.status.startsWith("RESOLVED")
          ? config.status === "RESOLVED_ACCEPTED"
            ? "Challenge accepted. Record excluded from screening evaluation and decision recalculated."
            : "Challenge rejected. Applicant was unable to provide sufficient documentation to support the dispute."
          : null,
        resolvedAt: config.status.startsWith("RESOLVED") ? faker.date.recent({ days: 5 }) : null,
      },
    });
  }

  // ------ Notices ------
  console.log("Creating adverse action notices...");
  const noticeApps = [applications[5], applications[6]];
  for (const app of noticeApps) {
    const applicant = await prisma.applicant.findUnique({ where: { id: app.applicantId } });
    await prisma.notice.create({
      data: {
        applicationId: app.id,
        type: "ADVERSE_ACTION" as NoticeType,
        content: {
          applicantName: `${applicant?.firstName} ${applicant?.lastName}`,
          propertyName: properties[noticeApps.indexOf(app) % properties.length].name,
          decisionDate: new Date().toISOString(),
          reasons: [
            "Credit score below minimum threshold (620)",
            "Insufficient income-to-rent ratio",
          ],
          rights: [
            "You have the right to obtain a free copy of your consumer report within 60 days",
            "You have the right to dispute the accuracy of information in your consumer report",
            "The landlord did not make this decision based on any information you provided to the CRA",
          ],
          fcraDisclosure: true,
        },
        craName: "TransUnion Rental Screening Solutions",
        craAddress: "P.O. Box 160, Woodlyn, PA 19094",
        craPhone: "1-800-916-8800",
        sentAt: faker.date.recent({ days: 3 }),
        sentMethod: "email",
      },
    });
  }

  // ------ Fairness Metrics ------
  console.log("Creating fairness metrics...");
  const periodStart = new Date("2025-01-01");
  const periodEnd = new Date("2025-12-31");

  const fairnessData: Array<{
    metricType: string;
    protectedClass: string;
    groupValue: string;
    value: number;
    sampleSize: number;
  }> = [
    { metricType: "approval_rate", protectedClass: "race", groupValue: "White", value: 0.78, sampleSize: 45 },
    { metricType: "approval_rate", protectedClass: "race", groupValue: "Black", value: 0.62, sampleSize: 38 },
    { metricType: "approval_rate", protectedClass: "race", groupValue: "Hispanic", value: 0.70, sampleSize: 32 },
    { metricType: "approval_rate", protectedClass: "race", groupValue: "Asian", value: 0.81, sampleSize: 28 },
    { metricType: "denial_rate", protectedClass: "race", groupValue: "White", value: 0.15, sampleSize: 45 },
    { metricType: "denial_rate", protectedClass: "race", groupValue: "Black", value: 0.29, sampleSize: 38 },
    { metricType: "denial_rate", protectedClass: "race", groupValue: "Hispanic", value: 0.22, sampleSize: 32 },
    { metricType: "disparate_impact", protectedClass: "race", groupValue: "Black vs White", value: 0.795, sampleSize: 83 },
    { metricType: "disparate_impact", protectedClass: "race", groupValue: "Hispanic vs White", value: 0.897, sampleSize: 77 },
    { metricType: "approval_rate", protectedClass: "sex", groupValue: "Male", value: 0.74, sampleSize: 52 },
    { metricType: "approval_rate", protectedClass: "sex", groupValue: "Female", value: 0.72, sampleSize: 48 },
    { metricType: "approval_rate", protectedClass: "familial_status", groupValue: "Has children under 18", value: 0.68, sampleSize: 35 },
    { metricType: "approval_rate", protectedClass: "familial_status", groupValue: "No children", value: 0.77, sampleSize: 65 },
  ];

  await prisma.fairnessMetric.createMany({
    data: fairnessData.map((m) => ({
      ...m,
      organizationId,
      periodStart,
      periodEnd,
    })),
  });

  // ------ Drift Alerts ------
  console.log("Creating drift alerts...");
  const driftAlerts: Array<{
    driftType: DriftType;
    severity: Severity;
    title: string;
    description: string;
    metricName: string;
    baselineValue: number;
    currentValue: number;
    deviationPct: number;
    threshold: number;
  }> = [
    {
      driftType: "DISPARITY_DRIFT",
      severity: "HIGH",
      title: "Increased Denial Rate Disparity - Race",
      description:
        "The denial rate disparity between Black and White applicants has increased from 12% to 14% over the past quarter, exceeding the 10% monitoring threshold.",
      metricName: "denial_rate_disparity_race",
      baselineValue: 0.12,
      currentValue: 0.14,
      deviationPct: 16.7,
      threshold: 10.0,
    },
    {
      driftType: "POLICY_DRIFT",
      severity: "MEDIUM",
      title: "Credit Score Distribution Shift",
      description:
        "The average credit score of applicants has shifted downward by 18 points compared to the baseline period. This may affect approval rates and fairness metrics.",
      metricName: "avg_credit_score",
      baselineValue: 680,
      currentValue: 662,
      deviationPct: 2.6,
      threshold: 2.0,
    },
    {
      driftType: "DATA_DRIFT",
      severity: "LOW",
      title: "Voucher Applicant Volume Increase",
      description:
        "The proportion of applicants with housing vouchers has increased from 15% to 22% over the past month. Monitoring for potential source-of-income discrimination impact.",
      metricName: "voucher_applicant_pct",
      baselineValue: 0.15,
      currentValue: 0.22,
      deviationPct: 46.7,
      threshold: 25.0,
    },
  ];

  await prisma.driftAlert.createMany({
    data: driftAlerts.map((a) => ({ ...a, organizationId })),
  });

  // ------ Jurisdictions & Rules ------
  console.log("Creating jurisdictions and rules...");
  const fedJurisdiction = await prisma.jurisdiction.create({
    data: {
      organizationId,
      name: "Federal Fair Housing Act",
      code: "FED",
      level: "FEDERAL" as JurisdictionLevel,
      isActive: true,
    },
  });

  const caJurisdiction = await prisma.jurisdiction.create({
    data: {
      organizationId,
      name: "California",
      code: "CA",
      level: "STATE" as JurisdictionLevel,
      parentId: fedJurisdiction.id,
      isActive: true,
    },
  });

  const jurisdictionRules = [
    {
      jurisdictionId: fedJurisdiction.id,
      category: "protected_classes",
      ruleKey: "fha_protected_classes",
      ruleText:
        "The Fair Housing Act prohibits discrimination based on race, color, national origin, religion, sex, familial status, and disability.",
      ruleData: {
        protectedClasses: ["race", "color", "national_origin", "religion", "sex", "familial_status", "disability"],
      },
      effectiveDate: new Date("1968-04-11"),
      version: 1,
    },
    {
      jurisdictionId: fedJurisdiction.id,
      category: "notice_requirements",
      ruleKey: "fcra_adverse_action",
      ruleText:
        "Under FCRA, adverse action notices must include: the CRA name/address/phone, a statement that the CRA did not make the decision, and notice of the right to dispute.",
      ruleData: {
        requiredFields: ["cra_name", "cra_address", "cra_phone", "dispute_rights", "free_report_rights"],
        timelineDays: 30,
      },
      effectiveDate: new Date("1970-10-26"),
      version: 1,
    },
    {
      jurisdictionId: caJurisdiction.id,
      category: "criminal_history",
      ruleKey: "ca_fair_chance_act",
      ruleText:
        "AB 1008 (California Fair Chance Act): Employers and housing providers cannot inquire about criminal history until after a conditional offer. Individualized assessment required for any criminal record consideration.",
      ruleData: {
        lookbackLimitYears: 7,
        requiresIndividualizedAssessment: true,
        prohibitedInquiryTiming: "pre-offer",
        factors: ["nature_and_gravity", "time_elapsed", "nature_of_job_or_housing"],
      },
      effectiveDate: new Date("2018-01-01"),
      version: 1,
    },
    {
      jurisdictionId: caJurisdiction.id,
      category: "source_of_income",
      ruleKey: "ca_source_of_income_protection",
      ruleText:
        "California Government Code 12955 prohibits discrimination based on source of income, including Section 8 vouchers, VASH, and other public assistance.",
      ruleData: {
        protectedSources: ["Section 8", "VASH", "CalWORKs", "SSI", "SSDI", "unemployment"],
        cannotDeny: true,
        cannotChargeDifferentTerms: true,
      },
      effectiveDate: new Date("2020-01-01"),
      version: 1,
    },
    {
      jurisdictionId: caJurisdiction.id,
      category: "protected_classes",
      ruleKey: "ca_feha_additional",
      ruleText:
        "California FEHA extends federal protections to include: source of income, sexual orientation, gender identity, gender expression, genetic information, marital status, military/veteran status, and primary language.",
      ruleData: {
        additionalClasses: [
          "source_of_income",
          "sexual_orientation",
          "gender_identity",
          "gender_expression",
          "genetic_information",
          "marital_status",
          "military_veteran_status",
          "primary_language",
        ],
      },
      effectiveDate: new Date("2020-01-01"),
      version: 1,
    },
  ];

  await prisma.jurisdictionRule.createMany({ data: jurisdictionRules });

  console.log("Seed complete!");
  console.log(`  - 3 properties (Palo Alto, San Francisco, Sacramento)`);
  console.log(`  - 3 screening policies with 5 rules each`);
  console.log(`  - 20 applicants with demographic data`);
  console.log(`  - 20 applications across 3 properties`);
  console.log(`  - 80 screening records (4 per application)`);
  console.log(`  - 12 decisions (5 approved, 3 denied, 2 conditional, 2 pending)`);
  console.log(`  - 4 applicant challenges`);
  console.log(`  - 2 adverse action notices`);
  console.log(`  - 13 fairness metrics`);
  console.log(`  - 3 drift alerts`);
  console.log(`  - 2 jurisdictions with 5 rules`);
}

// ---------------------------------------------------------------------------
// Cleanup helper
// ---------------------------------------------------------------------------

async function cleanOrganizationData(organizationId: string) {
  console.log("Cleaning existing data...");

  await prisma.jurisdictionRule.deleteMany({
    where: { jurisdiction: { organizationId } },
  });
  await prisma.jurisdiction.deleteMany({ where: { organizationId } });
  await prisma.driftAlert.deleteMany({ where: { organizationId } });
  await prisma.fairnessMetric.deleteMany({ where: { organizationId } });

  const appIds = (
    await prisma.application.findMany({
      where: { organizationId },
      select: { id: true },
    })
  ).map((a) => a.id);

  if (appIds.length > 0) {
    await prisma.notice.deleteMany({ where: { applicationId: { in: appIds } } });
    await prisma.document.deleteMany({ where: { applicationId: { in: appIds } } });
    await prisma.accommodation.deleteMany({ where: { applicationId: { in: appIds } } });
    await prisma.challenge.deleteMany({ where: { applicationId: { in: appIds } } });

    const decisionIds = (
      await prisma.decision.findMany({
        where: { applicationId: { in: appIds } },
        select: { id: true },
      })
    ).map((d) => d.id);

    if (decisionIds.length > 0) {
      await prisma.reasonCode.deleteMany({ where: { decisionId: { in: decisionIds } } });
      await prisma.humanReview.deleteMany({ where: { decisionId: { in: decisionIds } } });
      await prisma.override.deleteMany({ where: { decisionId: { in: decisionIds } } });
      await prisma.decision.deleteMany({ where: { id: { in: decisionIds } } });
    }

    await prisma.screeningRecord.deleteMany({ where: { applicationId: { in: appIds } } });
  }

  await prisma.application.deleteMany({ where: { organizationId } });
  await prisma.applicant.deleteMany({ where: { organizationId } });

  const policyIds = (
    await prisma.screeningPolicy.findMany({
      where: { organizationId },
      select: { id: true },
    })
  ).map((p) => p.id);

  if (policyIds.length > 0) {
    await prisma.policyRule.deleteMany({ where: { screeningPolicyId: { in: policyIds } } });
  }

  await prisma.screeningPolicy.deleteMany({ where: { organizationId } });
  await prisma.property.deleteMany({ where: { organizationId } });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
