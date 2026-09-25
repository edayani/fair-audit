const SECTIONS: Array<{ title: string; body?: string; items?: string[] }> = [
  {
    title: "Intended use",
    body: "Compliance auditing of tenant-screening decisions for residential housing — especially affordable, supportive, and publicly assisted housing — against the Fair Housing Act, the Fair Credit Reporting Act, HUD guidance, and state overlays.",
  },
  {
    title: "System type",
    body: "Deterministic, rule-based decision engine applying the property's published policy. Large language models are used only assistively, and every AI output requires human approval before it has any effect.",
  },
  {
    title: "Data practices",
    body: "No model is trained on applicant data. Demographic data (race, ethnicity, sex, familial status, disability) is used solely for civil-rights monitoring, never to score an applicant. Voucher status is used only protectively, to route cases for individualized review. AI-assisted features receive policy text and feature names — not applicant records.",
  },
  {
    title: "Evaluation",
    items: [
      "Impact ratio by protected class (four-fifths rule as a screening heuristic)",
      "Override and dispute-success rates",
      "Human-review coverage and individualized-assessment coverage",
      "Audit-trail completeness",
    ],
  },
  {
    title: "Safeguards",
    items: [
      "Proxy-risk detection for protected-class correlates",
      "Individualized assessment of criminal history (HUD OGC, 2016)",
      "Source-of-income protections (e.g., Cal. Gov. Code § 12955)",
      "VAWA protections for survivors of domestic violence",
    ],
  },
  {
    title: "Limitations",
    items: [
      "Statistical tests need adequate sample sizes; small groups are reported as insufficient",
      "AI-drafted content can be wrong and is never self-executing",
      "Jurisdictional coverage is configurable and must be verified by counsel",
      "FairAudit supports — and does not replace — legal judgment",
    ],
  },
  {
    title: "References",
    items: [
      "HUD Office of General Counsel, Guidance on Application of FHA Standards to the Use of Criminal Records (Apr. 4, 2016)",
      "NIST AI Risk Management Framework (AI RMF 1.0, Jan. 2023)",
      "Regulation (EU) 2024/1689 (Artificial Intelligence Act)",
      "Mitchell et al., “Model Cards for Model Reporting” (FAT* 2019)",
    ],
  },
];

export function ModelCard() {
  return (
    <div className="rounded-xl border bg-card">
      <div className="border-b px-5 py-4 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brass">Model card</p>
        <h3 className="mt-1 font-serif text-xl font-semibold">FairAudit screening compliance engine</h3>
      </div>
      <div className="grid gap-x-8 gap-y-5 px-5 py-5 sm:px-6 md:grid-cols-2">
        {SECTIONS.map((s) => (
          <div key={s.title}>
            <h4 className="text-sm font-semibold">{s.title}</h4>
            {s.body && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>}
            {s.items && (
              <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                {s.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-brass" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
