import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How FairAudit collects, uses, and protects account and applicant information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Legal" title="Privacy Policy" updated="September 25, 2026">
      <section>
        <p>
          FairAudit provides compliance software to housing providers. This policy explains what information we handle,
          why, and the choices available to you. When a housing provider uses FairAudit to evaluate applications, the
          provider controls the applicant data it uploads and FairAudit processes that data on the provider&apos;s behalf.
        </p>
      </section>
      <section>
        <h2>Information we handle</h2>
        <ul>
          <li>
            <strong>Account information</strong> — name, email address, and organization membership for people who sign in.
            Authentication is provided by our identity provider, Clerk.
          </li>
          <li>
            <strong>Applicant and screening records</strong> — information a housing provider uploads to evaluate an
            application, such as contact details, consumer-report data, determinations, notices, challenges, and
            accommodation requests.
          </li>
          <li>
            <strong>Voluntary demographic data</strong> — where a provider collects it for civil-rights monitoring. It is
            used only to measure outcomes across groups and is never used to score or decide an application. For
            accommodation requests we record only whether a request is disability-related, never the nature of a disability.
          </li>
          <li>
            <strong>Usage and security logs</strong> — records of actions taken in the product, which form the audit trail
            providers rely on for compliance.
          </li>
        </ul>
      </section>
      <section>
        <h2>How information is used</h2>
        <p>
          We use information to operate the service, maintain the audit trail and evidence vault, secure accounts, and
          support customers. We do not sell personal information, and we do not use applicant data to train machine-learning
          models. AI-assisted features process policy text and feature definitions, not applicant records.
        </p>
      </section>
      <section>
        <h2>Isolation, retention, and integrity</h2>
        <p>
          Each organization&apos;s data is logically isolated and access is scoped to that organization. Audit and evidence
          records are append-only by design so that the compliance record cannot be silently altered. Housing providers
          determine retention periods for their records consistent with their legal obligations.
        </p>
      </section>
      <section>
        <h2>Your choices</h2>
        <p>
          Applicants should direct requests about their records — including access, correction, or disputes — to the
          housing provider that received their application. Account holders may request access to or deletion of their
          account information by contacting their organization administrator.
        </p>
      </section>
      <section>
        <h2>Changes</h2>
        <p>We will update this page when our practices change and revise the date above.</p>
      </section>
    </LegalPage>
  );
}
