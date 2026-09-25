"use client";
// Governing legal standard — Federal + California (default) or judicial disparate-impact standard only
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Gavel, Landmark } from "lucide-react";
import { setComplianceMode } from "@/actions/jurisdiction";
import { COMPLIANCE_MODE_DESCRIPTIONS } from "@/lib/constants/jurisdictions";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/form";
import { cn, formatDateTime } from "@/lib/utils";

type Mode = "FEDERAL_CA" | "COURT_ONLY";

export function ComplianceModeToggle({
  currentMode,
  disclaimerAckedAt,
  canEdit,
}: {
  currentMode: string;
  disclaimerAckedAt: Date | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [acked, setAcked] = useState(false);

  function apply(mode: Mode, acknowledged?: boolean) {
    startTransition(async () => {
      const result = await setComplianceMode(mode, acknowledged);
      if (result.success) {
        toast.success("Governing standard updated and logged to the audit trail");
        setShowDisclaimer(false);
        setAcked(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      {(["FEDERAL_CA", "COURT_ONLY"] as const).map((mode) => {
        const desc = COMPLIANCE_MODE_DESCRIPTIONS[mode];
        const active = currentMode === mode;
        const Icon = mode === "FEDERAL_CA" ? Landmark : Gavel;
        return (
          <div key={mode} className={cn("rounded-xl border bg-card p-5 sm:p-6", active && "border-primary ring-1 ring-primary")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", active ? "bg-primary text-primary-foreground" : "bg-secondary")}>
                  <Icon className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{desc.label}</h3>
                  {desc.isDefault && <Badge tone="success" className="mt-1">Recommended</Badge>}
                </div>
              </div>
              {active ? (
                <Badge tone="brand">
                  <CheckCircle2 />
                  In effect
                </Badge>
              ) : (
                canEdit && (
                  <Button variant="outline" size="sm" onClick={() => (mode === "COURT_ONLY" ? setShowDisclaimer(true) : apply(mode))} disabled={isPending}>
                    Adopt this standard
                  </Button>
                )
              )}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{desc.description}</p>
            {active && mode === "COURT_ONLY" && disclaimerAckedAt && (
              <p className="mt-2 text-xs text-muted-foreground">Disclaimer acknowledged {formatDateTime(disclaimerAckedAt)}</p>
            )}
          </div>
        );
      })}

      {showDisclaimer && (
        <div className="rounded-xl border-2 border-orange-300 bg-orange-50 p-5 dark:border-orange-800 dark:bg-orange-950/30 sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="size-5 text-orange-600" />
            <h3 className="font-semibold text-orange-950 dark:text-orange-100">Before you narrow the governing standard</h3>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-orange-900 dark:text-orange-200">{COMPLIANCE_MODE_DESCRIPTIONS.COURT_ONLY.disclaimer}</p>
          <Checkbox
            checked={acked}
            onChange={(e) => setAcked(e.target.checked)}
            label="I have reviewed this change with counsel. I understand it will be recorded in the immutable audit trail."
            className="items-start text-orange-950 dark:text-orange-100"
          />
          <div className="mt-4 flex gap-2">
            <Button onClick={() => apply("COURT_ONLY", true)} disabled={!acked} loading={isPending} className="bg-orange-600 text-white hover:bg-orange-700">
              Confirm change
            </Button>
            <Button variant="outline" onClick={() => setShowDisclaimer(false)} disabled={isPending}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
