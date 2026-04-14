"use client";
// Compliance Mode toggle — Federal+CA default; optional Court-Only Disparate Impact mode
import { useState, useTransition } from "react";
import { setComplianceMode } from "@/actions/jurisdiction";
import { COMPLIANCE_MODE_DESCRIPTIONS } from "@/lib/constants/jurisdictions";
import { toast } from "@/lib/toast";
import { AlertTriangle, Shield, Scale } from "lucide-react";

export function ComplianceModeToggle({ currentMode, disclaimerAckedAt }: { currentMode: string; disclaimerAckedAt: Date | null }) {
  const [isPending, startTransition] = useTransition();
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerAcked, setDisclaimerAcked] = useState(false);

  function handleModeChange(mode: "FEDERAL_CA" | "COURT_ONLY") {
    if (mode === "COURT_ONLY") { setShowDisclaimer(true); return; }
    startTransition(async () => {
      const result = await setComplianceMode(mode);
      if (result.success) toast.success("Compliance mode updated");
      else toast.error(result.error ?? "Failed");
    });
  }

  function confirmCourtOnly() {
    if (!disclaimerAcked) { toast.error("You must acknowledge the disclaimer"); return; }
    startTransition(async () => {
      const result = await setComplianceMode("COURT_ONLY", true);
      if (result.success) { toast.success("Switched to Court-Only mode"); setShowDisclaimer(false); }
      else toast.error(result.error ?? "Failed");
    });
  }

  return (
    <div className="space-y-6">
      {(["FEDERAL_CA", "COURT_ONLY"] as const).map((mode) => {
        const desc = COMPLIANCE_MODE_DESCRIPTIONS[mode];
        const isActive = currentMode === mode;
        return (
          <div key={mode} className={`rounded-lg border p-6 ${isActive ? "border-primary bg-primary/5" : ""}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {mode === "FEDERAL_CA" ? <Shield className="h-5 w-5 text-primary" /> : <Scale className="h-5 w-5" />}
                <h3 className="font-semibold">{desc.label}</h3>
              </div>
              {isActive ? (
                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Active</span>
              ) : (
                <button onClick={() => handleModeChange(mode)} disabled={isPending} className="rounded-md border px-4 py-1.5 text-sm hover:bg-muted disabled:opacity-50">
                  Switch
                </button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{desc.description}</p>
            {desc.isDefault && <p className="text-xs text-green-600 dark:text-green-400 mt-1">Recommended default</p>}
          </div>
        );
      })}

      {showDisclaimer && (
        <div className="rounded-lg border-2 border-orange-400 bg-orange-50 dark:bg-orange-900/20 p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-300">Important Disclaimer</h3>
          </div>
          <p className="text-sm text-orange-700 dark:text-orange-400 mb-4">{COMPLIANCE_MODE_DESCRIPTIONS.COURT_ONLY.disclaimer}</p>
          <label className="flex items-start gap-2 mb-4">
            <input type="checkbox" checked={disclaimerAcked} onChange={(e) => setDisclaimerAcked(e.target.checked)} className="mt-1 rounded" />
            <span className="text-sm">I acknowledge this disclaimer and have consulted with legal counsel regarding the implications of this mode selection. This choice will be logged to the immutable audit trail.</span>
          </label>
          <div className="flex gap-2">
            <button onClick={confirmCourtOnly} disabled={isPending || !disclaimerAcked} className="rounded-md bg-orange-600 text-white px-4 py-2 text-sm disabled:opacity-50">Confirm Switch</button>
            <button onClick={() => { setShowDisclaimer(false); setDisclaimerAcked(false); }} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
