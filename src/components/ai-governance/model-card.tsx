export function ModelCard() {
  const sections = [
    {
      title: "Intended Use",
      body: "Fair housing screening compliance auditing for residential housing applications. Evaluates screening policies, decisions, and outcomes against federal Fair Housing Act (FHA), Fair Credit Reporting Act (FCRA), and state-specific regulations.",
    },
    {
      title: "Model Type",
      body: "Rule-based decision engine with LLM-assisted analysis (assistive only). All LLM outputs require human approval before being applied.",
    },
    {
      title: "Training Data",
      body: "No machine learning models are trained on applicant data. The LLM (Claude) is used assistively for: (1) natural language policy parsing, (2) reason code drafting, (3) proxy risk flagging. No applicant PII is sent to external APIs.",
    },
    {
      title: "Evaluation Metrics",
      items: [
        "Disparate Impact Ratio (4/5ths rule, 24 CFR \u00a7 100.500)",
        "Override Rate Monitoring",
        "Human Review Coverage Rate",
        "Audit Trail Completeness",
      ],
    },
    {
      title: "Ethical Considerations",
      items: [
        "Proxy risk detection for protected class correlates",
        "Criminal history individualized assessment (HUD OGC 2016)",
        "Source-of-income discrimination prevention (CA SB 329)",
        "VAWA survivor protections",
      ],
    },
    {
      title: "Limitations",
      items: [
        "Statistical fairness metrics require sufficient sample sizes (n\u226530 recommended)",
        "LLM-generated content may contain errors and requires human review",
        "Jurisdiction coverage limited to federal + California",
        "Does not replace legal counsel",
      ],
    },
    {
      title: "References",
      items: [
        'HUD Office of General Counsel, "Application of FHA Standards" (April 4, 2016)',
        "NIST AI Risk Management Framework (AI RMF 1.0, January 2023)",
        "EU Artificial Intelligence Act (Regulation 2024/1689)",
        'Mitchell et al., "Model Cards for Model Reporting" (2019)',
      ],
    },
  ];

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold mb-1">Model Card &mdash; FairAudit Screening Compliance Engine</h3>
      <hr className="mb-4" />

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.title}>
            <h4 className="font-semibold mb-1">{section.title}</h4>
            {section.body && (
              <p className="text-sm text-muted-foreground">{section.body}</p>
            )}
            {section.items && (
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">
                {section.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
