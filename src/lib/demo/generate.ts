// Sample portfolio for preview workspaces: three California affordable / supportive housing
// properties with internally consistent applications, determinations, due-process records,
// and civil-rights analytics. Deterministic (seeded) so every workspace sees the same story.
// Not a server action — only callable from trusted server code with an already-authorized org.
import "server-only";
import { faker } from "@faker-js/faker";
import { prisma } from "@/lib/prisma";
import { sha256 } from "@/lib/hash";
import { computeFairnessReport } from "@/lib/engines/fairness";
import { evaluateProxyRisk } from "@/lib/engines/proxy-risk";
import type { CriterionType, DecisionOutcome, Prisma, RecordType, RelevanceLabel, Severity } from "@/generated/prisma/client";

const DAY = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Portfolio definition
// ---------------------------------------------------------------------------

type RuleDef = {
  criterionType: CriterionType;
  label: string;
  description: string;
  operator: string;
  value: string;
  weight: number;
  isDisqualifying: boolean;
  lookbackMonths: number | null;
  mitigationAllowed: boolean;
  waiverConditions?: string;
};

const PROPERTIES: Array<{
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  unitCount: number;
  program: "family" | "psh" | "senior";
  policyName: string;
  rules: RuleDef[];
}> = [
  {
    name: "Mission Street Family Apartments",
    address: "2150 Folsom Street",
    city: "San Francisco",
    state: "CA",
    zipCode: "94110",
    unitCount: 96,
    program: "family",
    policyName: "LIHTC Family Screening Standard",
    rules: [
      { criterionType: "CREDIT_SCORE", label: "Credit score (mitigable)", description: "Scores below 600 are weighed with alternative evidence of ability to pay; never disqualifying alone.", operator: "GTE", value: "600", weight: 1.0, isDisqualifying: false, lookbackMonths: null, mitigationAllowed: true },
      { criterionType: "INCOME_REQUIREMENT", label: "Monthly income ≥ 2× tenant share of rent", description: "Applied to the tenant's portion only for voucher holders (Cal. Gov. Code § 12955).", operator: "GTE", value: "1900", weight: 1.2, isDisqualifying: false, lookbackMonths: null, mitigationAllowed: true },
      { criterionType: "EVICTION_HISTORY", label: "No eviction judgment in 36 months", description: "Judgments for the landlord only; dismissed or sealed filings are excluded.", operator: "LOOKBACK_MONTHS", value: "36", weight: 1.5, isDisqualifying: true, lookbackMonths: 36, mitigationAllowed: true, waiverConditions: "Judgment arising from domestic violence (VAWA) or satisfied with a documented payment plan." },
      { criterionType: "CRIMINAL_HISTORY", label: "Convictions within 60 months — individualized review", description: "Arrests without conviction are never considered. Convictions trigger a four-factor individualized assessment.", operator: "LOOKBACK_MONTHS", value: "60", weight: 1.3, isDisqualifying: false, lookbackMonths: 60, mitigationAllowed: true },
      { criterionType: "RENTAL_HISTORY", label: "12 months verifiable rental history", description: "Periods of homelessness or institutional stays are not counted against the applicant.", operator: "GTE", value: "12", weight: 0.8, isDisqualifying: false, lookbackMonths: 36, mitigationAllowed: true },
    ],
  },
  {
    name: "Harbor Light Supportive Housing",
    address: "730 East 5th Street",
    city: "Los Angeles",
    state: "CA",
    zipCode: "90013",
    unitCount: 64,
    program: "psh",
    policyName: "Housing First Low-Barrier Standard",
    rules: [
      { criterionType: "CRIMINAL_HISTORY", label: "Federally mandated exclusions only", description: "Lifetime sex-offender registration (42 U.S.C. § 13663) and methamphetamine production on federally assisted premises (42 U.S.C. § 1437n(f)). All other history is reviewed individually.", operator: "CONTAINS", value: "mandated_exclusion", weight: 1.0, isDisqualifying: false, lookbackMonths: null, mitigationAllowed: true },
      { criterionType: "RENTAL_HISTORY", label: "Rental history (informational only)", description: "Housing First: no minimum rental history. Gaps during homelessness are expected.", operator: "GTE", value: "0", weight: 0.3, isDisqualifying: false, lookbackMonths: null, mitigationAllowed: true },
    ],
  },
  {
    name: "Cedar Grove Senior Residences",
    address: "4100 Broadway",
    city: "Oakland",
    state: "CA",
    zipCode: "94611",
    unitCount: 120,
    program: "senior",
    policyName: "Senior Housing Screening Standard",
    rules: [
      { criterionType: "CREDIT_SCORE", label: "Credit score (mitigable)", description: "Medical debt is excluded from the calculation.", operator: "GTE", value: "580", weight: 0.8, isDisqualifying: false, lookbackMonths: null, mitigationAllowed: true },
      { criterionType: "INCOME_REQUIREMENT", label: "Monthly income ≥ 2× tenant share of rent", description: "SSI, SSDI, Social Security, and pensions count as income.", operator: "GTE", value: "1500", weight: 1.0, isDisqualifying: false, lookbackMonths: null, mitigationAllowed: true },
      { criterionType: "EVICTION_HISTORY", label: "No eviction judgment in 36 months", description: "Judgments for the landlord only.", operator: "LOOKBACK_MONTHS", value: "36", weight: 1.3, isDisqualifying: true, lookbackMonths: 36, mitigationAllowed: true },
      { criterionType: "CRIMINAL_HISTORY", label: "Convictions within 60 months — individualized review", description: "Four-factor individualized assessment required.", operator: "LOOKBACK_MONTHS", value: "60", weight: 1.2, isDisqualifying: false, lookbackMonths: 60, mitigationAllowed: true },
    ],
  },
];

type Scenario =
  | "clean"
  | "clean_dismissed_filing"
  | "credit_low"
  | "credit_low_mismatch"
  | "eviction"
  | "eviction_dv"
  | "credit_eviction"
  | "income_low"
  | "criminal_review"
  | "criminal_approved"
  | "criminal_denied"
  | "voucher_review"
  | "arrest_only_review"
  | "override_income"
  | "undecided";

type Outcome = DecisionOutcome | null;

const RACE_PLANS: Array<{ race: string; plan: Array<[Outcome, Scenario]> }> = [
  {
    race: "White",
    plan: [
      ["APPROVED", "clean"], ["APPROVED", "clean"], ["APPROVED", "criminal_approved"], ["APPROVED", "clean"], ["APPROVED", "clean_dismissed_filing"],
      ["APPROVED", "clean"], ["APPROVED", "clean"], ["CONDITIONAL", "income_low"], ["DENIED", "eviction"], ["PENDING_REVIEW", "criminal_review"],
    ],
  },
  {
    race: "Black or African American",
    plan: [
      ["APPROVED", "clean"], ["APPROVED", "clean"], ["APPROVED", "clean"], ["APPROVED", "clean"], ["CONDITIONAL", "credit_low"],
      ["DENIED", "eviction_dv"], ["DENIED", "criminal_denied"], ["DENIED", "credit_low_mismatch"], ["PENDING_REVIEW", "voucher_review"], [null, "undecided"],
    ],
  },
  {
    race: "Hispanic or Latino",
    plan: [
      ["APPROVED", "clean"], ["APPROVED", "clean"], ["APPROVED", "clean"], ["APPROVED", "clean_dismissed_filing"], ["APPROVED", "clean"],
      ["APPROVED", "clean"], ["CONDITIONAL", "income_low"], ["DENIED", "credit_eviction"], ["PENDING_REVIEW", "arrest_only_review"], [null, "undecided"],
    ],
  },
  {
    race: "Asian",
    plan: [
      ["APPROVED", "clean"], ["APPROVED", "clean"], ["APPROVED", "clean"], ["APPROVED", "clean"], ["APPROVED", "override_income"], ["DENIED", "eviction"],
    ],
  },
];

// Scenario → program, so each case is consistent with that property's published policy
const SCENARIO_PROGRAMS: Partial<Record<Scenario, Array<"family" | "psh" | "senior">>> = {
  override_income: ["family"],
  criminal_approved: ["senior"],
  criminal_denied: ["family"],
  criminal_review: ["family"],
  arrest_only_review: ["psh"],
  voucher_review: ["psh"],
  eviction: ["senior", "family"],
  eviction_dv: ["family"],
  credit_eviction: ["family"],
  credit_low: ["senior"],
  credit_low_mismatch: ["family"],
  income_low: ["family", "senior"],
};
const ROUND_ROBIN_PROGRAMS = ["psh", "family", "senior", "psh"] as const;
// Balanced independently for adverse and favorable outcomes so only the intended finding appears
const INCOME_CATEGORIES = ["Employment wages", "Housing voucher", "Disability or retirement benefits"];
const FAMILIAL_CATEGORIES = ["Household with children", "No children in household"];
const VOUCHER_TYPES = ["Housing Choice Voucher", "HUD-VASH", "Emergency Housing Voucher"];

// Deterministic PRNG so every sample workspace is identical
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export async function clearWorkspace(orgId: string) {
  const appIds = (await prisma.application.findMany({ where: { organizationId: orgId }, select: { id: true } })).map((a) => a.id);
  const decisionIds = (await prisma.decision.findMany({ where: { applicationId: { in: appIds } }, select: { id: true } })).map((d) => d.id);
  const policyIds = (await prisma.screeningPolicy.findMany({ where: { organizationId: orgId }, select: { id: true } })).map((p) => p.id);
  const reportIds = (await prisma.disparityReport.findMany({ where: { organizationId: orgId }, select: { id: true } })).map((r) => r.id);

  await prisma.$transaction([
    prisma.document.deleteMany({ where: { applicationId: { in: appIds } } }),
    prisma.notice.deleteMany({ where: { applicationId: { in: appIds } } }),
    prisma.accommodation.deleteMany({ where: { applicationId: { in: appIds } } }),
    prisma.challenge.deleteMany({ where: { applicationId: { in: appIds } } }),
    prisma.individualizedAssessment.deleteMany({ where: { decisionId: { in: decisionIds } } }),
    prisma.humanReview.deleteMany({ where: { decisionId: { in: decisionIds } } }),
    prisma.override.deleteMany({ where: { decisionId: { in: decisionIds } } }),
    prisma.reasonCode.deleteMany({ where: { decisionId: { in: decisionIds } } }),
    prisma.decision.deleteMany({ where: { id: { in: decisionIds } } }),
    prisma.screeningRecord.deleteMany({ where: { applicationId: { in: appIds } } }),
    prisma.application.deleteMany({ where: { organizationId: orgId } }),
    prisma.applicant.deleteMany({ where: { organizationId: orgId } }),
    prisma.policyRule.deleteMany({ where: { screeningPolicyId: { in: policyIds } } }),
    prisma.screeningPolicy.deleteMany({ where: { organizationId: orgId } }),
    prisma.portfolioProperty.deleteMany({ where: { property: { organizationId: orgId } } }),
    prisma.property.deleteMany({ where: { organizationId: orgId } }),
    prisma.burdenShiftingAnalysis.deleteMany({ where: { disparityReportId: { in: reportIds } } }),
    prisma.disparityReport.deleteMany({ where: { organizationId: orgId } }),
    prisma.fairnessMetric.deleteMany({ where: { organizationId: orgId } }),
    prisma.driftAlert.deleteMany({ where: { organizationId: orgId } }),
    prisma.featureRegistry.deleteMany({ where: { organizationId: orgId } }),
    prisma.algorithmicImpactAssessment.deleteMany({ where: { organizationId: orgId } }),
    prisma.jurisdictionRule.deleteMany({ where: { jurisdiction: { organizationId: orgId } } }),
    prisma.jurisdiction.deleteMany({ where: { organizationId: orgId } }),
  ]);
}

type RecordSpec = {
  recordType: RecordType;
  vendorName: string;
  summary: string;
  disposition: string | null;
  hasDisposition: boolean;
  amount?: number | null;
  dateOccurred: Date;
  normalizedData: Record<string, unknown>;
  relevance: RelevanceLabel;
  relevanceReason: string;
  identityConfidence: number;
  isQuarantined?: boolean;
  quarantineReason?: string;
};

type ReasonSpec = { code: string; category: string; shortText: string; detailedText: string; severity: Severity; criterion?: CriterionType };

export async function generateDemoData(orgId: string, reviewerId: string, reviewerEmail: string | null) {
  faker.seed(20260925);
  const rand = mulberry32(42);
  const now = Date.now();
  const at = (daysAgo: number, hour = 10) => {
    const d = new Date(now - daysAgo * DAY);
    d.setHours(hour, Math.floor(rand() * 59), 0, 0);
    return d;
  };

  // ------ Properties & published policies ------
  const properties = [];
  for (const [i, p] of PROPERTIES.entries()) {
    const property = await prisma.property.create({
      data: { organizationId: orgId, name: p.name, address: p.address, city: p.city, state: p.state, zipCode: p.zipCode, unitCount: p.unitCount },
    });
    const policy = await prisma.screeningPolicy.create({
      data: {
        organizationId: orgId,
        propertyId: property.id,
        name: p.policyName,
        version: 2,
        isActive: true,
        publishedAt: at(120 - i * 5),
        rules: { create: p.rules.map((r, idx) => ({ ...r, waiverConditions: r.waiverConditions ?? null, sortOrder: idx })) },
      },
      include: { rules: true },
    });
    // Superseded v1 retained for the record
    await prisma.screeningPolicy.create({
      data: {
        organizationId: orgId,
        propertyId: property.id,
        name: `${p.policyName} (superseded)`,
        version: 1,
        isActive: false,
        publishedAt: at(400 - i * 10),
        rules: { create: p.rules.slice(0, 2).map((r, idx) => ({ ...r, waiverConditions: null, sortOrder: idx })) },
      },
    });
    properties.push({ ...p, id: property.id, policy });
  }

  // ------ Applicants & applications ------
  type Planned = { race: string; outcome: Outcome; scenario: Scenario; program: "family" | "psh" | "senior"; income: string; familial: string };
  const planned: Planned[] = [];
  const used: Partial<Record<Scenario, number>> = {};
  let roundRobin = 0;
  const counters = { adverseIncome: 0, favorableIncome: 0, otherIncome: 0, adverseFamilial: 0, favorableFamilial: 0 };
  for (const group of RACE_PLANS) {
    for (const [outcome, scenario] of group.plan) {
      const fixed = SCENARIO_PROGRAMS[scenario];
      const program = fixed ? fixed[(used[scenario] = (used[scenario] ?? 0) + 1) - 1] : ROUND_ROBIN_PROGRAMS[roundRobin++ % ROUND_ROBIN_PROGRAMS.length];
      const adverse = outcome === "DENIED" || outcome === "CONDITIONAL";
      const income =
        scenario === "voucher_review"
          ? "Housing voucher"
          : adverse
            ? INCOME_CATEGORIES[counters.adverseIncome++ % 3]
            : outcome === "APPROVED"
              ? INCOME_CATEGORIES[counters.favorableIncome++ % 3]
              : INCOME_CATEGORIES[counters.otherIncome++ % 3];
      const familial = adverse ? FAMILIAL_CATEGORIES[counters.adverseFamilial++ % 2] : FAMILIAL_CATEGORIES[counters.favorableFamilial++ % 2];
      planned.push({ race: group.race, outcome, scenario, program: program!, income, familial });
    }
  }

  type Case = {
    plan: Planned;
    property: (typeof properties)[number];
    applicant: Awaited<ReturnType<typeof prisma.applicant.create>>;
    application: Awaited<ReturnType<typeof prisma.application.create>>;
    submittedAt: Date;
    monthlyIncome: number;
    hasVoucher: boolean;
  };
  const cases: Case[] = [];
  for (const [i, plan] of planned.entries()) {
    const property = properties.find((p) => p.program === plan.program)!;
    const sex = i % 2 === 0 ? "Female" : "Male";
    const firstName = faker.person.firstName(sex === "Female" ? "female" : "male");
    const lastName = faker.person.lastName();
    const sourceOfIncome = plan.income;
    const hasVoucher = sourceOfIncome === "Housing voucher";
    const voucherType = plan.scenario === "voucher_review" ? "Emergency Housing Voucher" : hasVoucher ? VOUCHER_TYPES[i % VOUCHER_TYPES.length] : null;
    const familial = plan.familial;
    const age = property.program === "senior" ? faker.number.int({ min: 63, max: 84 }) : faker.number.int({ min: 22, max: 58 });
    const submittedAt = at(6 + ((i * 11) % 72), 9 + (i % 7));

    const applicant = await prisma.applicant.create({
      data: {
        organizationId: orgId,
        firstName,
        lastName,
        email: faker.internet.email({ firstName, lastName, provider: "example.com" }).toLowerCase(),
        phone: faker.phone.number({ style: "national" }),
        dateOfBirth: new Date(now - age * 365.25 * DAY - faker.number.int({ min: 0, max: 360 }) * DAY),
        ssnLast4: faker.string.numeric(4),
        race: plan.race,
        ethnicity: plan.race === "Hispanic or Latino" ? "Hispanic or Latino" : "Not Hispanic or Latino",
        sex,
        familialStatus: familial,
        disability: plan.scenario === "voucher_review" || i % 9 === 0,
        nationalOrigin: "Not disclosed",
        sourceOfIncome,
        createdAt: submittedAt,
      },
    });

    const monthlyIncome =
      plan.scenario === "income_low" || plan.scenario === "override_income"
        ? faker.number.int({ min: 1150, max: 1450 })
        : property.program === "psh"
          ? faker.number.int({ min: 0, max: 1200 })
          : faker.number.int({ min: 2100, max: 4800 });

    const application = await prisma.application.create({
      data: {
        organizationId: orgId,
        applicantId: applicant.id,
        propertyId: property.id,
        unitAppliedFor: `Unit ${100 + ((i * 37) % 400)}`,
        monthlyIncome,
        hasVoucher,
        voucherType,
        voucherAmount: hasVoucher ? faker.number.int({ min: 1200, max: 2400 }) : null,
        status: "PENDING",
        submittedAt,
        createdAt: submittedAt,
      },
    });
    cases.push({ plan, property, applicant, application, submittedAt, monthlyIncome, hasVoucher });
  }

  // ------ Screening records ------
  const recordSpecs = new Map<string, RecordSpec[]>();
  for (const c of cases) {
    const { scenario } = c.plan;
    const psh = c.property.program === "psh";
    const t = (days: number) => new Date(c.submittedAt.getTime() - days * DAY);
    const bureau = ["TransUnion SmartMove", "Experian RentBureau", "Equifax"][c.application.id.charCodeAt(3) % 3];
    const idc = () => Math.round((93 + rand() * 7) * 10) / 10;
    const lowCredit = scenario === "credit_low" || scenario === "credit_low_mismatch" || scenario === "credit_eviction";
    const creditScore = lowCredit ? 540 + Math.floor(rand() * 30) : psh ? 560 + Math.floor(rand() * 120) : 615 + Math.floor(rand() * 140);
    const specs: RecordSpec[] = [];

    specs.push({
      recordType: "CREDIT_REPORT",
      vendorName: bureau,
      summary: `Credit score ${creditScore}. ${lowCredit ? "Two accounts in collections, including one medical collection." : "No accounts in collections."}`,
      disposition: lowCredit ? "below threshold" : "satisfactory",
      hasDisposition: true,
      dateOccurred: t(2),
      normalizedData: { creditScore, collectionsCount: lowCredit ? 2 : 0, medicalCollections: lowCredit ? 1 : 0 },
      relevance: psh ? "IRRELEVANT" : "RELEVANT",
      relevanceReason: psh
        ? "Housing First policy: credit history is not a screening criterion for this program."
        : "Relevant to ability to pay; medical debt excluded from evaluation.",
      identityConfidence: idc(),
    });

    const evictionAdverse = scenario === "eviction" || scenario === "eviction_dv" || scenario === "credit_eviction";
    specs.push(
      evictionAdverse
        ? {
            recordType: "EVICTION_HISTORY",
            vendorName: "CoreLogic",
            summary:
              scenario === "eviction_dv"
                ? "Unlawful detainer — judgment for landlord, Alameda County Superior Court (2024). Applicant reports tenancy ended after domestic violence."
                : `Unlawful detainer — judgment for landlord, ${["Alameda", "Los Angeles", "San Francisco"][c.application.id.charCodeAt(5) % 3]} County Superior Court (2024).`,
            disposition: "judgment_landlord",
            hasDisposition: true,
            amount: 3000 + Math.floor(rand() * 4000),
            dateOccurred: t(420 + Math.floor(rand() * 300)),
            normalizedData: { hasEvictions: true, evictionCount: 1, judgmentForLandlord: true },
            relevance: "RELEVANT",
            relevanceReason: "Judgment for landlord within the 36-month lookback defined in the published policy.",
            identityConfidence: idc(),
          }
        : scenario === "clean_dismissed_filing"
          ? {
              recordType: "EVICTION_HISTORY",
              vendorName: "CoreLogic",
              summary: "Unlawful detainer filing (2021) — dismissed before judgment.",
              disposition: "dismissed",
              hasDisposition: true,
              dateOccurred: t(1500),
              normalizedData: { hasEvictions: false, filings: 1, judgmentForLandlord: false },
              relevance: "IRRELEVANT",
              relevanceReason: "Dismissed filings are not evidence of tenancy conduct and are excluded from evaluation.",
              identityConfidence: idc(),
            }
          : {
              recordType: "EVICTION_HISTORY",
              vendorName: "CoreLogic",
              summary: "No unlawful detainer records found statewide.",
              disposition: "none_found",
              hasDisposition: true,
              dateOccurred: t(2),
              normalizedData: { hasEvictions: false },
              relevance: "IRRELEVANT",
              relevanceReason: "No adverse eviction history.",
              identityConfidence: idc(),
            }
    );

    if (scenario === "criminal_review" || scenario === "criminal_approved" || scenario === "criminal_denied") {
      const details =
        scenario === "criminal_denied"
          ? { summary: "Felony conviction — arson of an inhabited structure (2022); sentence completed 2024.", daysAgo: 1100 }
          : scenario === "criminal_approved"
            ? { summary: "Misdemeanor conviction — petty theft (2021); probation completed 2022.", daysAgo: 1650 }
            : { summary: "Misdemeanor conviction — possession of a controlled substance (2022); diversion completed.", daysAgo: 1250 };
      specs.push({
        recordType: "CRIMINAL_HISTORY",
        vendorName: "Checkr",
        summary: details.summary,
        disposition: "convicted",
        hasDisposition: true,
        dateOccurred: t(details.daysAgo),
        normalizedData: { hasRecords: true, convictions: 1, felony: scenario === "criminal_denied" },
        relevance: "CONDITIONAL",
        relevanceReason: "Conviction within the 60-month lookback. California requires an individualized assessment of criminal history; automatic denial is prohibited.",
        identityConfidence: idc(),
      });
    } else if (scenario === "arrest_only_review") {
      specs.push({
        recordType: "CRIMINAL_HISTORY",
        vendorName: "Checkr",
        summary: "Arrest (2023) — no charges filed.",
        disposition: "no_charges",
        hasDisposition: true,
        dateOccurred: t(900),
        normalizedData: { hasRecords: true, convictions: 0, arrestsOnly: 1 },
        relevance: "PROHIBITED",
        relevanceReason: "Arrests that did not result in conviction may not be considered (HUD OGC Guidance, 2016; California criminal-history regulations).",
        identityConfidence: idc(),
      });
    } else if (scenario === "credit_low_mismatch") {
      specs.push({
        recordType: "CRIMINAL_HISTORY",
        vendorName: "Checkr",
        summary: "Felony record located by name-only match (Riverside County, 2019).",
        disposition: null,
        hasDisposition: false,
        dateOccurred: t(2300),
        normalizedData: { hasRecords: true, matchMethod: "name_only" },
        relevance: "IRRELEVANT",
        relevanceReason: "Excluded pending identity verification — record quarantined.",
        identityConfidence: 46.5,
        isQuarantined: true,
        quarantineReason: "Name-only match; date of birth does not match applicant. No final disposition reported.",
      });
    } else {
      specs.push({
        recordType: "CRIMINAL_HISTORY",
        vendorName: "Checkr",
        summary: "No criminal records found within the lookback period.",
        disposition: "none_found",
        hasDisposition: true,
        dateOccurred: t(2),
        normalizedData: { hasRecords: false },
        relevance: "IRRELEVANT",
        relevanceReason: "No criminal history to consider.",
        identityConfidence: idc(),
      });
    }

    const months = scenario === "voucher_review" ? 8 : 14 + Math.floor(rand() * 60);
    specs.push({
      recordType: "RENTAL_HISTORY",
      vendorName: "Experian RentBureau",
      summary:
        scenario === "voucher_review"
          ? "8 months of verified rental history; no tenancy between 2022 and 2024 (period of homelessness per referral)."
          : `${months} months of verified rental history. ${rand() < 0.85 ? "On-time payments." : "Two late payments, both cured."}`,
      disposition: scenario === "voucher_review" ? "insufficient" : "satisfactory",
      hasDisposition: true,
      dateOccurred: t(30),
      normalizedData: { monthsVerified: months },
      relevance: psh ? "CONDITIONAL" : "RELEVANT",
      relevanceReason: psh ? "Informational only under Housing First; gaps during homelessness are not adverse." : "Relevant to tenancy; periods of homelessness are not counted against the applicant.",
      identityConfidence: idc(),
    });

    if (c.property.program !== "psh") {
      specs.push({
        recordType: "INCOME_VERIFICATION",
        vendorName: "Equifax",
        summary: `Verified monthly income $${c.monthlyIncome.toLocaleString()}${c.hasVoucher ? " plus housing assistance payment" : ""}.`,
        disposition: "verified",
        hasDisposition: true,
        dateOccurred: t(5),
        normalizedData: { monthlyIncome: c.monthlyIncome },
        relevance: "RELEVANT",
        relevanceReason: c.hasVoucher ? "Evaluated against the tenant's share of rent only (source-of-income protection)." : "Relevant to ability to pay.",
        identityConfidence: idc(),
      });
    }
    recordSpecs.set(c.application.id, specs);
  }

  const createdRecords = await prisma.screeningRecord.createManyAndReturn({
    data: cases.flatMap((c) =>
      (recordSpecs.get(c.application.id) ?? []).map((r) => ({
        applicationId: c.application.id,
        vendorName: r.vendorName,
        recordType: r.recordType,
        rawData: { source: r.vendorName, fetchedAt: r.dateOccurred.toISOString(), ...r.normalizedData } as Prisma.InputJsonValue,
        normalizedData: r.normalizedData as Prisma.InputJsonValue,
        summary: r.summary,
        disposition: r.disposition,
        hasDisposition: r.hasDisposition,
        amount: r.amount ?? null,
        dateOccurred: r.dateOccurred,
        identityConfidence: r.identityConfidence,
        matchMethod: r.isQuarantined ? "name_only" : "ssn4,dob,name",
        isQuarantined: r.isQuarantined ?? false,
        quarantineReason: r.quarantineReason ?? null,
        relevance: r.relevance,
        relevanceReason: r.relevanceReason,
        createdAt: c.submittedAt,
      }))
    ),
    select: { id: true, applicationId: true, recordType: true },
  });
  const recordsFor = (appId: string, type?: RecordType) =>
    createdRecords.filter((r) => r.applicationId === appId && (!type || r.recordType === type)).map((r) => r.id);

  // ------ Determinations ------
  const REASONS: Record<string, ReasonSpec> = {
    credit: { code: "CR-001", category: "Credit", shortText: "Credit score below minimum threshold", detailedText: "The applicant's credit score fell below the policy threshold after excluding medical collections. The criterion is weighted, not disqualifying, and may be mitigated with evidence of ability to pay.", severity: "MEDIUM", criterion: "CREDIT_SCORE" },
    eviction: { code: "EV-001", category: "Eviction", shortText: "Eviction judgment within 36-month lookback", detailedText: "A judgment for the landlord in an unlawful detainer action was entered within the 36-month lookback in the published policy. Dismissed or sealed filings were excluded.", severity: "HIGH", criterion: "EVICTION_HISTORY" },
    income: { code: "IN-001", category: "Income", shortText: "Income below 2× tenant share of rent", detailedText: "Verified monthly income is below twice the tenant's share of rent. Conditional approval is available with a qualified guarantor or documented rental assistance.", severity: "MEDIUM", criterion: "INCOME_REQUIREMENT" },
    criminal: { code: "CM-001", category: "Criminal", shortText: "Conviction within lookback — individualized assessment", detailedText: "A conviction within the 60-month lookback was identified. Under HUD guidance and California regulations, it may be considered only after an individualized assessment of its nature, recency, rehabilitation, and relationship to tenancy.", severity: "HIGH", criterion: "CRIMINAL_HISTORY" },
    rentalGap: { code: "RH-002", category: "Rental", shortText: "Limited verifiable rental history", detailedText: "Fewer than 12 months of rental history could be verified. The gap coincides with a documented period of homelessness, which the policy does not count against the applicant; routed for review.", severity: "LOW", criterion: "RENTAL_HISTORY" },
    review: { code: "RV-001", category: "Review", shortText: "Human review required", detailedText: "A record requires human judgment before a determination can issue (prohibited or conditional record present).", severity: "LOW" },
  };

  const reasonsFor: Record<Scenario, ReasonSpec[]> = {
    clean: [],
    clean_dismissed_filing: [],
    credit_low: [REASONS.credit],
    credit_low_mismatch: [REASONS.credit],
    eviction: [REASONS.eviction],
    eviction_dv: [REASONS.eviction],
    credit_eviction: [REASONS.eviction, REASONS.credit],
    income_low: [REASONS.income],
    criminal_review: [REASONS.criminal],
    criminal_approved: [REASONS.criminal],
    criminal_denied: [REASONS.criminal],
    voucher_review: [REASONS.rentalGap],
    arrest_only_review: [REASONS.review],
    override_income: [REASONS.income],
    undecided: [],
  };

  const auditRows: Prisma.AuditLogCreateManyInput[] = [];
  const evidenceRows: Prisma.EvidenceVaultEntryCreateManyInput[] = [];
  const audit = (tableName: string, recordId: string, action: string, timestamp: Date, extra: Partial<Prisma.AuditLogCreateManyInput> = {}, byReviewer = false) =>
    auditRows.push({
      organizationId: orgId,
      tableName,
      recordId,
      action,
      timestamp,
      userId: byReviewer ? reviewerId : null,
      userEmail: byReviewer ? reviewerEmail : null,
      ...extra,
    });

  const decisionsByApp = new Map<string, { id: string; outcome: DecisionOutcome; decidedAt: Date }>();

  for (const c of cases) {
    const appId = c.application.id;
    audit("Application", appId, "CREATE", c.submittedAt, { metadata: { applicationId: appId } });
    audit("ScreeningRecord", appId, "INGEST", new Date(c.submittedAt.getTime() + 2 * 3600e3), {
      metadata: { applicationId: appId },
      after: { count: recordsFor(appId).length },
    });
    if (!c.plan.outcome) continue;

    const decidedAt = new Date(c.submittedAt.getTime() + (1 + Math.floor(rand() * 3)) * DAY);
    const reasons = reasonsFor[c.plan.scenario];
    const pending = c.plan.outcome === "PENDING_REVIEW";
    const reviewed = ["criminal_approved", "criminal_denied", "eviction", "credit_eviction"].includes(c.plan.scenario);
    const engineOutcome: DecisionOutcome = c.plan.scenario === "override_income" ? "CONDITIONAL" : reviewed ? "PENDING_REVIEW" : c.plan.outcome;
    const failing = new Set(reasons.map((r) => r.criterion).filter(Boolean));
    const evaluations = c.property.policy.rules.map((rule) => {
      const passed = !failing.has(rule.criterionType);
      return {
        ruleId: rule.id,
        ruleLabel: rule.label,
        criterionType: rule.criterionType,
        passed,
        score: passed ? 80 + Math.round(rand() * 20) : 25 + Math.round(rand() * 20),
        weight: rule.weight,
        isDisqualifying: rule.isDisqualifying,
      };
    });
    const reviewReasons = [
      ...(c.hasVoucher ? ["Applicant holds a housing voucher — individualized review of income criteria."] : []),
      ...(reasons.some((r) => r.category === "Criminal") ? ["Criminal history requires individualized assessment (HUD OGC 2016; California regulations)."] : []),
      ...(c.plan.scenario === "arrest_only_review" ? ["A prohibited record (arrest without conviction) was excluded; confirm no other basis for denial."] : []),
    ];

    const decision = await prisma.decision.create({
      data: {
        applicationId: appId,
        screeningPolicyId: c.property.policy.id,
        outcome: c.plan.outcome,
        confidenceScore: Math.round((pending ? 55 : 78) + rand() * 18),
        isAutomatic: !pending && !reviewed && c.plan.scenario !== "override_income",
        decidedAt,
        createdAt: decidedAt,
        evaluationData: {
          overallScore: Math.round(evaluations.reduce((s, e) => s + e.score * e.weight, 0) / Math.max(1, evaluations.reduce((s, e) => s + e.weight, 0))),
          engineOutcome,
          evaluations,
          reviewReasons,
        } as Prisma.InputJsonValue,
        reasonCodes: {
          create: reasons.map((r, idx) => ({
            code: r.code,
            category: r.category,
            shortText: r.shortText,
            detailedText: r.detailedText,
            severity: r.severity,
            policyRuleId: c.property.policy.rules.find((rule) => rule.criterionType === r.criterion)?.id ?? null,
            sortOrder: idx,
          })),
        },
      },
    });
    decisionsByApp.set(appId, { id: decision.id, outcome: c.plan.outcome, decidedAt });

    await prisma.application.update({
      where: { id: appId },
      data: { status: pending ? "IN_REVIEW" : "DECIDED", decidedAt: pending ? null : decidedAt },
    });
    audit("Decision", decision.id, "EVALUATE", decidedAt, {
      metadata: { applicationId: appId },
      after: { outcome: engineOutcome, reasonCodes: reasons.map((r) => r.code) },
    });

    // Individualized assessments + human review for criminal-history cases
    if (c.plan.scenario === "criminal_approved" || c.plan.scenario === "criminal_denied") {
      const approve = c.plan.scenario === "criminal_approved";
      const assessment = approve
        ? {
            natureAndSeriousness: "Misdemeanor petty theft; no violence, weapons, or harm to persons or property of other residents.",
            natureSeverity: 2,
            timeElapsed: "Offense in 2021; probation completed in 2022 without violation.",
            timeElapsedMonths: 54,
            rehabilitation: "Continuous employment for 3 years; completed restorative-justice program; positive landlord reference since 2022.",
            rehabilitationScore: 4,
            mitigatingCircumstances: "Offense occurred during a period of unemployment and housing instability.",
            mitigatingScore: 3,
            tenancyNexus: "No demonstrable relationship to resident safety or the property. Subsequent tenancy history is positive.",
            overallAssessment: "Considering all four factors, the record does not indicate a present risk to residents or property. Approve.",
            recommendedOutcome: "APPROVE",
          }
        : {
            natureAndSeriousness: "Felony arson of an inhabited dwelling — conduct posing a direct risk to the safety of residents and property.",
            natureSeverity: 5,
            timeElapsed: "Offense in 2022; sentence completed in 2024.",
            timeElapsedMonths: 36,
            rehabilitation: "Some programming completed in custody; limited evidence of rehabilitation since release.",
            rehabilitationScore: 2,
            mitigatingCircumstances: "Applicant reports a mental-health crisis at the time; no documentation provided. Accommodation and reconsideration were offered.",
            mitigatingScore: 2,
            tenancyNexus: "Recent conduct directly endangering occupied housing bears a demonstrable relationship to resident safety.",
            overallAssessment: "Recency and severity outweigh the mitigating information presently in the record. Deny, with reconsideration available on submission of additional evidence.",
            recommendedOutcome: "DENY",
          };
      const assessedAt = new Date(decidedAt.getTime() + 20 * 3600e3);
      const ia = await prisma.individualizedAssessment.create({
        data: { decisionId: decision.id, ...assessment, assessedBy: reviewerEmail ?? "Compliance reviewer", assessedAt, createdAt: assessedAt },
      });
      const reviewedAt = new Date(assessedAt.getTime() + 2 * 3600e3);
      await prisma.humanReview.create({
        data: {
          decisionId: decision.id,
          reviewerId,
          action: approve ? "APPROVE" : "DENY",
          notes: approve
            ? "Individualized assessment supports approval; conviction is remote in time and unrelated to tenancy."
            : "Denied following individualized assessment. Applicant informed of the right to submit mitigating evidence and to request reconsideration.",
          reviewedAt,
          createdAt: reviewedAt,
        },
      });
      audit("IndividualizedAssessment", ia.id, "INDIVIDUALIZED_ASSESSMENT", assessedAt, { metadata: { applicationId: appId }, after: { recommendedOutcome: assessment.recommendedOutcome } }, true);
      audit("HumanReview", decision.id, approve ? "REVIEW_APPROVE" : "REVIEW_DENY", reviewedAt, { metadata: { applicationId: appId } }, true);
      evidenceRows.push({
        organizationId: orgId,
        entityType: "decision",
        entityId: decision.id,
        documentType: "individualized_assessment",
        fileUrl: `vault://decision/${decision.id}`,
        contentHash: sha256(assessment),
        description: "HUD four-factor individualized assessment of criminal history",
        storedAt: assessedAt,
      });
    } else if (reviewed) {
      const reviewedAt = new Date(decidedAt.getTime() + 6 * 3600e3);
      await prisma.humanReview.create({
        data: {
          decisionId: decision.id,
          reviewerId,
          action: "DENY",
          notes: "Judgment for landlord confirmed against court record; no VAWA or payment-plan waiver applies. Applicant may submit mitigating information.",
          reviewedAt,
          createdAt: reviewedAt,
        },
      });
      audit("HumanReview", decision.id, "REVIEW_DENY", reviewedAt, { metadata: { applicationId: appId } }, true);
    }

    if (c.plan.scenario === "override_income") {
      const overriddenAt = new Date(decidedAt.getTime() + 26 * 3600e3);
      const justification =
        "Continuum of Care case manager documented a rapid-rehousing subsidy covering 70% of rent for 12 months, bringing the tenant share within the income standard. Approval is consistent with the policy's mitigation provision.";
      await prisma.override.create({
        data: { decisionId: decision.id, overriddenById: reviewerId, originalOutcome: "CONDITIONAL", newOutcome: "APPROVED", justification, overriddenAt },
      });
      audit("Override", decision.id, "OVERRIDE", overriddenAt, { metadata: { applicationId: appId, justification }, before: { outcome: "CONDITIONAL" }, after: { outcome: "APPROVED" } }, true);
      evidenceRows.push({
        organizationId: orgId,
        entityType: "decision",
        entityId: decision.id,
        documentType: "override_justification",
        fileUrl: `vault://decision/${decision.id}/override`,
        contentHash: sha256({ originalOutcome: "CONDITIONAL", newOutcome: "APPROVED", justification }),
        description: "Override CONDITIONAL → APPROVED with written justification",
        storedAt: overriddenAt,
      });
    }

    // Adverse-action notices for denials and conditional approvals
    if (c.plan.outcome === "DENIED" || c.plan.outcome === "CONDITIONAL") {
      const generatedAt = new Date(decidedAt.getTime() + 30 * 3600e3);
      const type = c.plan.outcome === "CONDITIONAL" ? "CONDITIONAL_APPROVAL" : "ADVERSE_ACTION";
      const vendors = [...new Set((recordSpecs.get(appId) ?? []).map((r) => r.vendorName))];
      const content = {
        applicantName: `${c.applicant.firstName} ${c.applicant.lastName}`,
        applicantEmail: c.applicant.email,
        propertyName: c.property.name,
        propertyAddress: `${c.property.address}, ${c.property.city}, ${c.property.state} ${c.property.zipCode}`,
        decisionDate: decidedAt.toISOString(),
        outcome: c.plan.outcome,
        reasonCodes: reasons.map(({ code, category, shortText, detailedText }) => ({ code, category, shortText, detailedText })),
        applicantRights: {
          freeReportRight: "You have the right to obtain a free copy of your consumer report from the consumer reporting agency identified in this notice if you request it within 60 days of receiving this notice.",
          disputeRight: "You have the right to dispute directly with the consumer reporting agency the accuracy or completeness of any information in the report it furnished.",
          reportingAgencyNotice: "The consumer reporting agency did not make this decision and is unable to provide you with the specific reasons why it was made.",
          fairHousingNotice: "You may request a reasonable accommodation, submit mitigating information, or challenge the accuracy or relevance of any record considered. If you believe you have experienced housing discrimination, you may contact HUD's Office of Fair Housing and Equal Opportunity at 1-800-669-9777.",
        },
        consumerReportingAgencies: vendors,
        generatedAt: generatedAt.toISOString(),
        noticeType: type,
      };
      const delivered = c.plan.scenario !== "credit_low_mismatch";
      const notice = await prisma.notice.create({
        data: {
          applicationId: appId,
          type,
          content: content as Prisma.InputJsonValue,
          craName: vendors.join(", "),
          craAddress: "Contact information for each consumer reporting agency is listed in the notice.",
          generatedAt,
          createdAt: generatedAt,
          sentAt: delivered ? new Date(generatedAt.getTime() + 3 * 3600e3) : null,
          sentMethod: delivered ? (c.hasVoucher ? "postal" : "email") : null,
        },
      });
      audit("Notice", notice.id, "NOTICE_GENERATED", generatedAt, { metadata: { applicationId: appId }, after: { type } }, true);
      if (delivered) audit("Notice", notice.id, "NOTICE_DELIVERED", new Date(generatedAt.getTime() + 3 * 3600e3), { metadata: { applicationId: appId } }, true);
      evidenceRows.push({
        organizationId: orgId,
        entityType: "notice",
        entityId: notice.id,
        documentType: `${type.toLowerCase()}_notice`,
        fileUrl: `vault://notice/${notice.id}`,
        contentHash: sha256(content),
        description: `${type === "ADVERSE_ACTION" ? "Adverse action" : "Conditional approval"} notice for ${content.applicantName}`,
        storedAt: generatedAt,
      });
    }
  }

  // ------ Challenges ------
  const byScenario = (s: Scenario) => cases.find((c) => c.plan.scenario === s)!;
  const challengeDefs = [
    {
      c: byScenario("eviction_dv"),
      type: "MITIGATION" as const,
      status: "UNDER_REVIEW" as const,
      recordType: "EVICTION_HISTORY" as RecordType,
      description: "The 2024 eviction followed my leaving the unit to escape domestic violence. I have a protective order and a letter from the shelter where I stayed. I am asking that the judgment not be held against me.",
      circumstanceType: "domestic_violence",
      mitigatingEvidence: "Domestic violence restraining order (Alameda County Superior Court) and shelter advocate letter. VAWA protections may apply.",
    },
    {
      c: byScenario("credit_low_mismatch"),
      type: "ACCURACY" as const,
      status: "SUBMITTED" as const,
      recordType: "CRIMINAL_HISTORY" as RecordType,
      description: "The Riverside County felony record is not mine. I have never lived in Riverside County and my date of birth does not match the record.",
    },
    {
      c: byScenario("arrest_only_review"),
      type: "RELEVANCE" as const,
      status: "RESOLVED_ACCEPTED" as const,
      recordType: "CRIMINAL_HISTORY" as RecordType,
      description: "The 2023 arrest never led to charges. It should not be part of my housing application.",
      resolution: "Sustained. Arrests not resulting in conviction may not be considered; the record is labeled prohibited and excluded from evaluation.",
    },
    {
      c: byScenario("credit_eviction"),
      type: "ACCURACY" as const,
      status: "RESOLVED_REJECTED" as const,
      recordType: "EVICTION_HISTORY" as RecordType,
      description: "I believe the judgment amount is wrong and was paid.",
      resolution: "Denied. Court docket confirms the judgment for landlord; applicant did not provide proof of satisfaction. Applicant may resubmit with a satisfaction of judgment.",
    },
  ];
  for (const def of challengeDefs) {
    const submittedAt = new Date((decisionsByApp.get(def.c.application.id)?.decidedAt ?? def.c.submittedAt).getTime() + 3 * DAY);
    const resolved = def.status.startsWith("RESOLVED");
    const resolvedAt = resolved ? new Date(submittedAt.getTime() + 4 * DAY) : null;
    const challenge = await prisma.challenge.create({
      data: {
        applicationId: def.c.application.id,
        type: def.type,
        status: def.status,
        description: def.description,
        recordIds: recordsFor(def.c.application.id, def.recordType),
        circumstanceType: "circumstanceType" in def ? def.circumstanceType : null,
        mitigatingEvidence: "mitigatingEvidence" in def ? def.mitigatingEvidence : null,
        resolution: "resolution" in def ? def.resolution : null,
        resolvedBy: resolved ? reviewerEmail : null,
        resolvedAt,
        submittedAt,
        createdAt: submittedAt,
      },
    });
    audit("Challenge", challenge.id, "CHALLENGE_SUBMITTED", submittedAt, { metadata: { applicationId: def.c.application.id }, after: { type: def.type } });
    if (resolvedAt) {
      audit("Challenge", challenge.id, def.status === "RESOLVED_ACCEPTED" ? "CHALLENGE_SUSTAINED" : "CHALLENGE_DENIED", resolvedAt, { metadata: { applicationId: def.c.application.id } }, true);
    }
  }

  // ------ Reasonable accommodations ------
  const psh = cases.find((c) => c.property.program === "psh" && c.plan.outcome === "APPROVED")!;
  const accommodationDefs = [
    {
      c: byScenario("voucher_review"),
      accommodationType: "Waiver of screening criterion",
      description: "Requests that the rental-history criterion be waived: the gap in tenancy resulted from disability-related hospitalization and homelessness. Referral from the coordinated entry system attached.",
      isDisabilityRelated: true,
      status: "PENDING",
    },
    {
      c: psh,
      accommodationType: "Third-party representative or advocate",
      description: "Requests that all communications also be sent to the applicant's Continuum of Care case manager, who will assist with paperwork.",
      isDisabilityRelated: true,
      status: "GRANTED",
    },
  ];
  for (const def of accommodationDefs) {
    const createdAt = new Date(def.c.submittedAt.getTime() + DAY);
    const acc = await prisma.accommodation.create({
      data: {
        applicationId: def.c.application.id,
        accommodationType: def.accommodationType,
        description: def.description,
        isDisabilityRelated: def.isDisabilityRelated,
        status: def.status,
        grantedAt: def.status === "GRANTED" ? new Date(createdAt.getTime() + 2 * DAY) : null,
        createdAt,
      },
    });
    audit("Accommodation", acc.id, "ACCOMMODATION_REQUESTED", createdAt, { metadata: { applicationId: def.c.application.id } });
    if (def.status === "GRANTED") audit("Accommodation", acc.id, "ACCOMMODATION_GRANTED", new Date(createdAt.getTime() + 2 * DAY), { metadata: { applicationId: def.c.application.id } }, true);
  }

  // ------ Disparity report (last 90 days) + burden-shifting analysis ------
  const periodEnd = new Date(now);
  const periodStart = new Date(now - 90 * DAY);
  const decided = cases.filter((c) => c.plan.outcome && c.plan.outcome !== "PENDING_REVIEW");
  const reportInput = decided.map((c) => ({
    outcome: c.plan.outcome as string,
    demographics: {
      race: c.applicant.race,
      sex: c.applicant.sex,
      familialStatus: c.applicant.familialStatus,
      disability: c.applicant.disability ? "Yes" : "No",
      nationalOrigin: c.applicant.nationalOrigin,
      sourceOfIncome: c.applicant.sourceOfIncome,
    },
    overridden: c.plan.scenario === "override_income",
    disputed: challengeDefs.some((d) => d.c.application.id === c.application.id),
    disputeSucceeded: challengeDefs.some((d) => d.c.application.id === c.application.id && d.status === "RESOLVED_ACCEPTED"),
    denialCriteria: reasonsFor[c.plan.scenario].map((r) => r.category),
  }));
  const report = computeFairnessReport(reportInput, periodStart, periodEnd);
  const flagged = report.disparateImpactResults.filter((r) => r.hasPotentialDisparateImpact);
  const disparityReport = await prisma.disparityReport.create({
    data: {
      organizationId: orgId,
      periodStart,
      periodEnd,
      reportDate: new Date(now - 2 * DAY),
      summary: `Analysis of ${decided.length} decided applications. ${flagged.length} protected class${flagged.length === 1 ? "" : "es"} below the four-fifths benchmark.`,
      findings: JSON.parse(JSON.stringify(report)),
      status: "ISSUED",
    },
  });
  audit("DisparityReport", disparityReport.id, "FAIRNESS_ANALYSIS", new Date(now - 2 * DAY), { after: { findings: flagged.length } }, true);

  const raceFinding = report.disparateImpactResults.find((r) => r.protectedClass === "race" && r.hasPotentialDisparateImpact);
  if (raceFinding) {
    const analysis = {
      protectedClass: "race",
      impactRatio: raceFinding.impactRatio,
      isFaciallyNeutral: true,
      facialNeutralityNotes:
        "The eviction-judgment and credit criteria are facially neutral. Adverse outcomes for Black applicants are concentrated in the 36-month eviction-judgment criterion, which identifies the specific practice causing the disparity (robust causality).",
      hasLegitimateObjective: true,
      legitimateObjectiveNotes:
        "Reducing the risk of nonpayment is a substantial, legitimate, nondiscriminatory interest. However, the record contains no validation that a single judgment more than 12 months old predicts nonpayment in a subsidized tenancy where the tenant share is capped.",
      lessDiscriminatoryAltExists: true,
      lessDiscriminatoryAltNotes:
        "Shorten the lookback to 12 months, exclude satisfied judgments and those arising from domestic violence (VAWA), and weigh remaining eviction history through individualized review with mitigation.",
      conclusion: "NEEDS_FURTHER_REVIEW",
      analystNotes: "Recommend piloting the 12-month lookback at Mission Street Family Apartments and re-running the disparity report in 90 days.",
    };
    const analyzedAt = new Date(now - DAY);
    const bsa = await prisma.burdenShiftingAnalysis.create({
      data: { ...analysis, disparityReportId: disparityReport.id, analyzedBy: reviewerEmail ?? "Compliance analyst", analyzedAt, createdAt: analyzedAt },
    });
    audit("BurdenShiftingAnalysis", bsa.id, "BURDEN_SHIFTING_ANALYSIS", analyzedAt, { after: { protectedClass: "race", conclusion: analysis.conclusion } }, true);
    evidenceRows.push({
      organizationId: orgId,
      entityType: "disparity_report",
      entityId: disparityReport.id,
      documentType: "burden_shifting_analysis",
      fileUrl: `vault://disparity_report/${disparityReport.id}`,
      contentHash: sha256(analysis),
      description: "Three-step burden-shifting analysis — race",
      storedAt: analyzedAt,
    });
  }

  await prisma.fairnessMetric.createMany({
    data: report.disparateImpactResults.flatMap((di) =>
      di.groups.map((g) => ({
        organizationId: orgId,
        metricType: "approval_rate",
        protectedClass: di.protectedClass,
        groupValue: g.groupName,
        value: g.approvalRate,
        sampleSize: g.total,
        periodStart,
        periodEnd,
        metadata: { impactRatio: di.impactRatio, hasPotentialDisparateImpact: di.hasPotentialDisparateImpact },
        calculatedAt: new Date(now - 2 * DAY),
      }))
    ),
  });

  // ------ Feature registry (proxy governance) ------
  const FEATURES = [
    { name: "credit_score", displayName: "Credit score", source: "vendor", dataType: "number", tenancyRelevance: "Ability to pay (tenant share)" },
    { name: "eviction_judgments", displayName: "Eviction judgments", source: "vendor", dataType: "number", tenancyRelevance: "Prior tenancy conduct" },
    { name: "criminal_convictions", displayName: "Criminal convictions", source: "vendor", dataType: "category", tenancyRelevance: "Resident safety, subject to individualized assessment" },
    { name: "rental_payment_history", displayName: "Rental payment history", source: "vendor", dataType: "number", tenancyRelevance: "Prior payment conduct" },
    { name: "monthly_income", displayName: "Verified monthly income", source: "applicant", dataType: "number", tenancyRelevance: "Ability to pay (tenant share)" },
    { name: "zip_code", displayName: "Prior ZIP code", source: "applicant", dataType: "string", legalReviewStatus: "rejected" },
    { name: "medical_debt", displayName: "Medical collections", source: "vendor", dataType: "number", legalReviewStatus: "rejected" },
    { name: "household_size", displayName: "Household size", source: "applicant", dataType: "number", legalReviewStatus: "pending" },
    { name: "source_of_income", displayName: "Source of income", source: "applicant", dataType: "category", legalReviewStatus: "approved" },
    { name: "student_loan_debt", displayName: "Student loan balance", source: "vendor", dataType: "number" },
  ];
  await prisma.featureRegistry.createMany({
    data: FEATURES.map((f) => {
      const risk = evaluateProxyRisk(f.name);
      return {
        organizationId: orgId,
        name: f.name,
        displayName: f.displayName,
        dataType: f.dataType,
        source: f.source,
        proxyRiskScore: risk.riskScore,
        flaggedAsProxy: risk.isProxy,
        proxyFor: risk.proxyFor,
        proxyExplanation:
          f.name === "source_of_income"
            ? `${risk.explanation} Approved by counsel for civil-rights monitoring only — excluded from scoring.`
            : risk.explanation,
        tenancyRelevance: f.tenancyRelevance ?? null,
        legalReviewStatus: f.legalReviewStatus ?? (risk.isProxy ? "pending" : null),
        isActive: !["zip_code", "medical_debt"].includes(f.name),
      };
    }),
  });

  // ------ Monitoring alerts ------
  const raceResult = report.disparateImpactResults.find((r) => r.protectedClass === "race");
  await prisma.driftAlert.createMany({
    data: [
      {
        organizationId: orgId,
        driftType: "DISPARITY_DRIFT",
        severity: "HIGH",
        title: "Approval-rate gap by race exceeds four-fifths benchmark",
        description:
          "The lowest-approved racial group's approval rate fell below 80% of the highest group's over the last 90 days. Eviction-judgment and credit criteria account for most adverse outcomes; a burden-shifting analysis is required.",
        metricName: "impact_ratio_race",
        baselineValue: 0.86,
        currentValue: raceResult ? Math.round(raceResult.impactRatio * 1000) / 1000 : 0.7,
        deviationPct: raceResult ? Math.round(((0.86 - raceResult.impactRatio) / 0.86) * 1000) / 10 : 18.6,
        threshold: 7,
        status: "NEW",
        detectedAt: new Date(now - 2 * DAY),
      },
      {
        organizationId: orgId,
        driftType: "DATA_DRIFT",
        severity: "MEDIUM",
        title: "Criminal records missing final dispositions",
        description: "An increasing share of criminal-history records arrive without a final disposition. Records without a disposition are quarantined and cannot support an adverse determination.",
        metricName: "missing_disposition_rate",
        baselineValue: 0.02,
        currentValue: 0.06,
        deviationPct: 200,
        threshold: 50,
        status: "ACKNOWLEDGED",
        acknowledgedAt: new Date(now - DAY),
        acknowledgedBy: reviewerEmail,
        detectedAt: new Date(now - 5 * DAY),
      },
      {
        organizationId: orgId,
        driftType: "POLICY_DRIFT",
        severity: "LOW",
        title: "Override rate returned to baseline",
        description: "Reviewer overrides rose above baseline at Mission Street Family Apartments, prompting retraining on the mitigation provision. Rates have since normalized.",
        metricName: "override_rate",
        baselineValue: 0.05,
        currentValue: 0.06,
        deviationPct: 20,
        threshold: 25,
        status: "RESOLVED",
        resolvedAt: new Date(now - 10 * DAY),
        resolution: "Site staff retrained on documenting mitigation; override justifications now reviewed weekly by compliance.",
        detectedAt: new Date(now - 24 * DAY),
      },
    ],
  });

  // ------ Jurisdictions ------
  const fed = await prisma.jurisdiction.create({ data: { organizationId: orgId, name: "United States (federal)", code: "FED", level: "FEDERAL" } });
  const ca = await prisma.jurisdiction.create({ data: { organizationId: orgId, name: "California", code: "CA", level: "STATE", parentId: fed.id } });
  const la = await prisma.jurisdiction.create({ data: { organizationId: orgId, name: "City of Los Angeles", code: "LA", level: "LOCAL", parentId: ca.id } });
  await prisma.jurisdictionRule.createMany({
    data: [
      { jurisdictionId: fed.id, category: "protected_classes", ruleKey: "fha_protected_classes", ruleText: "The Fair Housing Act prohibits discrimination because of race, color, religion, sex (including sexual orientation and gender identity), national origin, familial status, and disability. 42 U.S.C. § 3604.", effectiveDate: new Date("1968-04-11") },
      { jurisdictionId: fed.id, category: "notice_requirements", ruleKey: "fcra_adverse_action", ruleText: "Adverse action based on a consumer report requires notice identifying the consumer reporting agency, a statement that the agency did not make the decision, and the consumer's rights to a free report and to dispute. 15 U.S.C. § 1681m(a).", effectiveDate: new Date("1971-04-25") },
      { jurisdictionId: fed.id, category: "criminal_history", ruleKey: "hud_ogc_2016", ruleText: "Arrest records may not be the basis for denial; blanket criminal-history bans are likely unjustified; convictions must be assessed individually for nature, severity, and recency. HUD OGC Guidance (Apr. 4, 2016).", effectiveDate: new Date("2016-04-04") },
      { jurisdictionId: fed.id, category: "mandatory_exclusions", ruleKey: "federally_assisted_exclusions", ruleText: "Federally assisted housing must deny admission to lifetime sex-offender registrants (42 U.S.C. § 13663) and persons convicted of producing methamphetamine on federally assisted premises (42 U.S.C. § 1437n(f)).", effectiveDate: new Date("1998-10-21") },
      { jurisdictionId: fed.id, category: "survivor_protections", ruleKey: "vawa_housing", ruleText: "Applicants may not be denied admission to covered housing programs on the basis that they are or have been victims of domestic violence, dating violence, sexual assault, or stalking. 34 U.S.C. § 12491.", effectiveDate: new Date("2013-03-07") },
      { jurisdictionId: fed.id, category: "reasonable_accommodation", ruleKey: "fha_reasonable_accommodation", ruleText: "Refusing reasonable accommodations in rules, policies, practices, or services when necessary to afford a person with a disability equal opportunity to use and enjoy a dwelling is unlawful. 42 U.S.C. § 3604(f)(3)(B).", effectiveDate: new Date("1989-03-12") },
      { jurisdictionId: ca.id, category: "source_of_income", ruleKey: "ca_source_of_income", ruleText: "FEHA prohibits discrimination based on source of income, including federal, state, and local housing assistance such as Housing Choice Vouchers. Cal. Gov. Code § 12955; SB 329 (2019).", effectiveDate: new Date("2020-01-01") },
      { jurisdictionId: ca.id, category: "criminal_history", ruleKey: "ca_crd_criminal_history", ruleText: "California Civil Rights Council regulations restrict consideration of criminal history in housing, prohibit reliance on arrests and certain other records, and require an individualized assessment before adverse action. Cal. Code Regs. tit. 2, § 12264 et seq.", effectiveDate: new Date("2020-01-01") },
      { jurisdictionId: ca.id, category: "protected_classes", ruleKey: "ca_feha_additional", ruleText: "FEHA adds protected characteristics including source of income, marital status, ancestry, sexual orientation, gender identity and expression, genetic information, veteran or military status, and age.", effectiveDate: new Date("2020-01-01") },
      { jurisdictionId: la.id, category: "tenant_protections", ruleKey: "la_local_overlay", ruleText: "Local overlay placeholder: configure City of Los Angeles tenant-screening and just-cause provisions with counsel before relying on this rule set.", effectiveDate: new Date("2023-01-01") },
    ],
  });

  // ------ Persist history ------
  auditRows.push({
    organizationId: orgId,
    tableName: "Organization",
    recordId: orgId,
    action: "SAMPLE_DATA_LOADED",
    userId: reviewerId,
    userEmail: reviewerEmail,
    timestamp: new Date(),
    metadata: { applications: cases.length, properties: properties.length },
  });
  await prisma.auditLog.createMany({ data: auditRows });
  if (evidenceRows.length) await prisma.evidenceVaultEntry.createMany({ data: evidenceRows });
}
