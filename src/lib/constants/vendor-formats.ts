// Spec §4.B — Known vendor data formats for ingestion normalization

export const VENDOR_FORMATS = {
  transunion: {
    name: "TransUnion",
    recordTypes: ["CREDIT_REPORT", "CRIMINAL_HISTORY", "EVICTION_HISTORY"],
    fieldMapping: {
      "applicant_name": "firstName,lastName",
      "ssn_last4": "ssnLast4",
      "dob": "dateOfBirth",
      "credit_score": "normalizedData.creditScore",
      "derogatory_count": "normalizedData.derogatoryCount",
      "collection_count": "normalizedData.collectionCount",
      "total_debt": "normalizedData.totalDebt",
      "monthly_payment": "normalizedData.monthlyPayment",
      "case_number": "normalizedData.caseNumber",
      "filing_date": "dateOccurred",
      "disposition": "disposition",
      "disposition_date": "dateResolved",
    },
  },
  experian: {
    name: "Experian",
    recordTypes: ["CREDIT_REPORT"],
    fieldMapping: {
      "consumer_name": "firstName,lastName",
      "ssn4": "ssnLast4",
      "birth_date": "dateOfBirth",
      "fico_score": "normalizedData.creditScore",
      "negative_items": "normalizedData.derogatoryCount",
      "collections": "normalizedData.collectionCount",
      "outstanding_debt": "normalizedData.totalDebt",
    },
  },
  corelogic: {
    name: "CoreLogic",
    recordTypes: ["CRIMINAL_HISTORY", "EVICTION_HISTORY"],
    fieldMapping: {
      "subject_name": "firstName,lastName",
      "ssn_suffix": "ssnLast4",
      "date_of_birth": "dateOfBirth",
      "record_type": "recordType",
      "offense_date": "dateOccurred",
      "offense_type": "normalizedData.offenseType",
      "case_disposition": "disposition",
      "court_name": "normalizedData.courtName",
      "county": "normalizedData.county",
    },
  },
  manual: {
    name: "Manual Entry",
    recordTypes: ["CREDIT_REPORT", "CRIMINAL_HISTORY", "EVICTION_HISTORY", "RENTAL_HISTORY", "EMPLOYMENT_VERIFICATION", "INCOME_VERIFICATION"],
    fieldMapping: {},
  },
  demo: {
    name: "Demo Data",
    recordTypes: ["CREDIT_REPORT", "CRIMINAL_HISTORY", "EVICTION_HISTORY", "RENTAL_HISTORY", "INCOME_VERIFICATION"],
    fieldMapping: {},
  },
} as const;

export type VendorName = keyof typeof VENDOR_FORMATS;
