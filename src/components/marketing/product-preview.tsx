import { CheckCircle2, CircleDashed, FileText, Fingerprint, Scale } from "lucide-react";

/**
 * Illustrative rendering of a FairAudit case file (static HTML, not a screenshot).
 * All names and figures are fictional sample data.
 */
export function ProductPreview() {
  const steps = [
    { label: "Consumer report data ingested", done: true },
    { label: "Stale eviction filing quarantined — no disposition", done: true },
    { label: "Individualized assessment completed", done: true },
    { label: "Adverse-action notice delivered", done: false },
  ];

  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-[28px] bg-[radial-gradient(ellipse_at_top,rgba(214,178,94,0.25),transparent_60%)] blur-2xl" aria-hidden />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b1322] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="ml-3 truncate text-[11px] text-white/40">fairaudit.site/dashboard/applications/…</span>
        </div>

        <div className="grid gap-px bg-white/5 sm:grid-cols-[1.25fr_1fr]">
          <div className="bg-[#0f182b] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d6b25e]">Application case file</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="font-serif text-xl font-semibold text-white">D. Alvarez</p>
              <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 text-[10px] font-medium text-sky-300">Pending review</span>
            </div>
            <p className="mt-0.5 text-xs text-white/50">Harbor Light Supportive Housing · HUD-VASH voucher</p>

            <div className="mt-4 space-y-2">
              {[
                { code: "CM-001", text: "Conviction within lookback — assessment required" },
                { code: "RH-002", text: "Rental history gap during period of homelessness" },
              ].map((r) => (
                <div key={r.code} className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                  <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/80">{r.code}</span>
                  <span className="text-xs leading-snug text-white/75">{r.text}</span>
                </div>
              ))}
            </div>

            <ul className="mt-4 space-y-1.5">
              {steps.map((s) => (
                <li key={s.label} className="flex items-center gap-2 text-xs text-white/70">
                  {s.done ? <CheckCircle2 className="size-3.5 text-emerald-400" /> : <CircleDashed className="size-3.5 text-amber-300" />}
                  {s.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-px bg-white/5">
            <div className="bg-[#0f182b] p-5">
              <div className="flex items-center gap-2 text-xs text-white/60">
                <Scale className="size-3.5 text-[#d6b25e]" />
                Disparate impact · source of income
              </div>
              <div className="mt-3 space-y-2">
                {[
                  { g: "Employment income", v: 0.82, w: "82%" },
                  { g: "Housing voucher", v: 0.61, w: "61%" },
                ].map((row) => (
                  <div key={row.g}>
                    <div className="mb-1 flex justify-between text-[11px] text-white/60">
                      <span>{row.g}</span>
                      <span className={row.v < 0.66 ? "text-rose-300" : ""}>{row.w}</span>
                    </div>
                    <div className="relative h-1.5 rounded-full bg-white/10">
                      <div className={row.v < 0.66 ? "h-full rounded-full bg-rose-400" : "h-full rounded-full bg-sky-400"} style={{ width: row.w }} />
                      <div className="absolute -top-0.5 h-2.5 w-px bg-white/60" style={{ left: "65.6%" }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-rose-300">Impact ratio 0.74 — burden-shifting analysis opened</p>
            </div>
            <div className="bg-[#0f182b] p-5">
              <div className="flex items-center gap-2 text-xs text-white/60">
                <Fingerprint className="size-3.5 text-[#d6b25e]" />
                Evidence vault
              </div>
              <div className="mt-3 space-y-1.5">
                {["individualized_assessment", "adverse_action_notice"].map((d, i) => (
                  <div key={d} className="flex items-center justify-between gap-2 rounded-md bg-white/[0.03] px-2.5 py-1.5">
                    <span className="flex items-center gap-1.5 text-[11px] text-white/70">
                      <FileText className="size-3" />
                      {d}
                    </span>
                    <code className="font-mono text-[10px] text-white/40">{i === 0 ? "9f2c…a41e" : "3b7d…0c9f"}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-[11px] text-white/40">Illustrative product view with fictional sample data</p>
    </div>
  );
}
