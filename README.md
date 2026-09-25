# FairAudit — Fair housing compliance for affordable & supportive housing

**AI-assisted compliance infrastructure for property managers of affordable, supportive, and homeless housing — making every tenant-screening decision lawful, explainable, reviewable, and defensible.**

Live at [fairaudit.site](https://fairaudit.site).

---

## Overview

FairAudit sits between a housing provider's screening pipeline and its final accept/deny decision. It answers five questions for every application:

1. **Is this criterion relevant?** -- Does the data point have a legitimate business justification for this property type and jurisdiction?
2. **Does it create disparate impact?** -- Do approval rates differ across protected classes beyond the 80% threshold?
3. **Can the applicant understand why?** -- Is there a plain-language reason code tied to every factor that influenced the decision?
4. **Did a human review it?** -- Was a qualified reviewer involved before any adverse action was taken?
5. **Can we prove it later?** -- Is every decision, override, and document preserved in an immutable audit trail?

FairAudit does not make screening decisions. It audits them.

## Features

The system is organized into thirteen modules:

| Module | Name | Description |
|--------|------|-------------|
| **A** | Policy Configuration Engine | Define screening criteria, thresholds, and weights per property with version-controlled policy snapshots. |
| **B** | Data Ingestion & Normalization | Import credit, criminal, eviction, and income reports from multiple vendor formats into a unified schema. |
| **C** | Identity Resolution & Matching | Link ingested records to the correct applicant using deterministic and fuzzy matching with confidence scores. |
| **D** | Relevance Labeling | Tag each data point as relevant or irrelevant based on the active policy, property type, and jurisdiction rules. |
| **E** | Proxy Risk & Feature Governance | Flag screening features that correlate with protected classes above a configurable threshold. |
| **F** | Fairness Testing & Disparate Impact | Run four-fifths-rule and statistical significance tests across every protected class and criterion. |
| **G** | Explainability & Reason Codes | Generate human-readable reason codes for every factor that contributed to a screening outcome. |
| **H** | Human Review & Override | Route flagged applications to a review queue where reviewers can approve, deny, or override with justification. |
| **I** | Applicant Challenge Portal | Allow applicants to view their reason codes, upload supporting documents, and submit formal challenges. |
| **J** | Adverse-Action Notices (PDF) | Produce compliant adverse-action notice PDFs with all required disclosures and reason codes. |
| **K** | Audit Log & Evidence Vault | Record every decision, override, and document change in an append-only log with tamper-evident hashing. |
| **L** | Continuous Monitoring & Drift Detection | Track fairness metrics over time and alert when approval-rate gaps or feature distributions drift beyond thresholds. |
| **M** | Jurisdiction & Rules Engine | Resolve overlapping federal, state, and local fair-housing rules and apply the most protective standard. |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, Server Actions, `proxy.ts`) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 with a custom design system (`src/components/ui`) |
| Database | PostgreSQL with Prisma ORM 7 (`@prisma/adapter-pg`) |
| Authentication | Clerk (multi-tenant organizations) |
| PDF Generation | @react-pdf/renderer (loaded on demand) |
| LLM Integration | Anthropic Claude (assistive only, human approval required) |
| Validation | Zod |
| Hosting | Vercel (static marketing pages, daily drift cron) |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- pnpm or npm

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd fair-audit
```

2. Install dependencies:

```bash
npm install
```

3. Copy the environment template and fill in your values:

```bash
cp .env.example .env
```

See `.env.example` for all variables. At minimum you need `DATABASE_URL` and the Clerk keys. `ADMIN_EMAIL`, `CRON_SECRET`, `CLERK_WEBHOOK_SIGNING_SECRET`, and `ANTHROPIC_API_KEY` enable the admin console, the daily drift cron, the Clerk webhook, and AI-assisted features respectively.

4. Push the Prisma schema to your database:

```bash
npx prisma db push
```

5. Generate the Prisma client:

```bash
npx prisma generate
```

6. (Optional) Seed the database with sample data:

```bash
npx prisma db seed
```

7. Start the development server:

```bash
npm run dev
```

8. Open [http://localhost:3000](http://localhost:3000), sign up with Clerk, and create an organization.

9. Click **Sample data** in the top bar (or **Load sample portfolio** on an empty workspace) to populate three California affordable and supportive housing properties with applicants, determinations, challenges, notices, and civil-rights analytics.

## Compliance Modes

FairAudit ships with two compliance modes, configured in the policy engine:

- **FEDERAL_CA** (default) -- Applies the federal Fair Housing Act together with California's FEHA, including source-of-income protection (Cal. Gov. Code § 12955) and the Civil Rights Council's criminal-history regulations. The most protective standard; recommended.
- **COURT_ONLY** -- Evaluates discriminatory effects solely under the judicial standard of *Texas Dep't of Housing & Community Affairs v. Inclusive Communities Project, Inc.*, 576 U.S. 519 (2015), without relying on agency regulations. Requires an acknowledged disclaimer that is written to the audit trail.

The jurisdiction engine (Module M) resolves conflicts when federal, state, and local rules overlap, always applying the most protective standard.

## LLM Integration

FairAudit uses Anthropic Claude for three assistive-only tasks:

1. **Natural-language policy parsing** -- Converts plain-English screening policies into structured policy configurations. A human must review and approve the parsed output before it takes effect.
2. **Reason code generation** -- Drafts human-readable explanations for screening factors. All generated codes are queued for reviewer approval before being attached to any notice.
3. **Proxy risk flagging** -- Analyzes feature correlations and suggests which screening criteria may serve as proxies for protected classes. Suggestions are surfaced in the review queue for human evaluation.

All three features require explicit human approval before any output affects a screening decision. If no `ANTHROPIC_API_KEY` is configured, the system returns mock responses so that development and testing can proceed without an API key.

## Architecture

Key architectural patterns:

- **Multi-tenant row-level security** -- Every database query is scoped to the active Clerk organization. Server actions enforce organization context before any read or write.
- **Immutable audit logs** -- Every server action that changes data writes an attributed audit-log entry (`src/lib/audit.ts`). A Prisma client extension rejects updates and deletes on audit and evidence tables, and preserved evidence carries a SHA-256 content hash.
- **Server actions with org enforcement** -- All mutations flow through Next.js server actions that verify the caller's organization membership and role before executing.
- **Decision engine pipeline** -- Applications pass through a sequential pipeline: ingestion, identity resolution, relevance labeling, proxy-risk check, fairness test, reason-code generation, and human review routing. Each stage writes to the audit log.

## Project Structure

```
src/
  actions/          # Server actions (one file per domain)
    application.ts
    audit.ts
    challenge.ts
    decision.ts
    fairness.ts
    identity.ts
    ingestion.ts
    jurisdiction.ts
    monitoring.ts
    notice.ts
    policy.ts
    property.ts
    proxy-risk.ts
    relevance.ts
    review.ts
    settings.ts
  app/              # Next.js App Router pages
    api/            # API routes (Clerk webhook, drift cron)
    dashboard/      # Main authenticated UI
      applicants/
      applications/
      audit-log/
      evidence-vault/
      fairness/
      features/
      ingestion/
      jurisdictions/
      monitoring/
      properties/
      review-queue/
      settings/
    sign-in/
    sign-up/
  components/       # React components by module
    audit/
    challenge/
    demo/
    explainability/
    fairness/
    identity/
    ingestion/
    jurisdiction/
    layout/
    monitoring/
    notices/
    policy/
    providers/
    proxy-risk/
    relevance/
    review/
    shared/
    ui/             # shadcn/ui primitives
  hooks/            # Custom React hooks
  lib/
    constants/      # Jurisdictions, protected classes, reason codes, criteria
    engines/        # Core decision-engine logic
      decision.ts
      drift.ts
      fairness.ts
      identity.ts
      jurisdiction-resolver.ts
      proxy-risk.ts
      reason-codes.ts
      relevance.ts
    llm/            # Anthropic Claude client, prompts, types
    validators/     # Zod schemas per domain
    auth.ts
    prisma.ts
    prisma-audit-middleware.ts
    utils.ts
  types/            # Shared TypeScript type definitions
prisma/
  schema.prisma     # Database schema
```

## License

MIT
