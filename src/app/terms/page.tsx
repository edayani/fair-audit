import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing use of the FairAudit compliance platform.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Legal" title="Terms of Service" updated="September 25, 2026">
      <section>
        <p>
          These terms govern access to and use of FairAudit. By creating an account or using the service, you agree to
          them on behalf of yourself and the organization you represent.
        </p>
      </section>
      <section>
        <h2>The service</h2>
        <p>
          FairAudit is compliance software that helps housing providers apply written screening policies, document
          determinations, provide notices, and monitor outcomes. FairAudit is not a consumer reporting agency, does not
          furnish consumer reports, and does not make housing decisions. Your organization remains responsible for every
          determination and for compliance with applicable law.
        </p>
      </section>
      <section>
        <h2>Not legal advice</h2>
        <p>
          Legal references in the product and on this site describe the sources that features are designed around. They
          are not legal advice, and applicability varies by property, program, and jurisdiction. Consult qualified counsel
          about your obligations.
        </p>
      </section>
      <section>
        <h2>Your responsibilities</h2>
        <ul>
          <li>Use the service only for lawful purposes and in compliance with fair-housing and consumer-reporting law.</li>
          <li>Obtain any authorizations required to process applicant information you upload.</li>
          <li>Keep credentials secure and ensure members of your organization follow these terms.</li>
          <li>Review AI-assisted suggestions before relying on them; they are drafts, not determinations.</li>
        </ul>
      </section>
      <section>
        <h2>Preview and full access</h2>
        <p>
          New workspaces begin in preview mode with sample data. Full access, which enables recording determinations to the
          audit trail, is granted at FairAudit&apos;s discretion.
        </p>
      </section>
      <section>
        <h2>Availability and changes</h2>
        <p>
          We work to keep the service available and secure but provide it &ldquo;as is&rdquo; without warranties to the
          extent permitted by law. We may update these terms; continued use after an update constitutes acceptance.
        </p>
      </section>
    </LegalPage>
  );
}
