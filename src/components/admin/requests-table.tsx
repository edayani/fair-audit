"use client";

import { useState } from "react";
import { approveAccessRequest, denyAccessRequest } from "@/actions/access-request";
import { CheckCircle, XCircle, Clock, Building2 } from "lucide-react";
import { toast } from "sonner";

type AccessRequest = {
  id: string;
  email: string;
  reason: string | null;
  status: string;
  createdAt: Date;
  respondedAt: Date | null;
  organization: {
    id: string;
    name: string;
    accessTier: string;
  };
};

export function AdminRequestsTable({ requests }: { requests: AccessRequest[] }) {
  const [pending, setPending] = useState<string | null>(null);

  const pending_requests = requests.filter((r) => r.status === "PENDING");
  const resolved_requests = requests.filter((r) => r.status !== "PENDING");

  async function handleApprove(id: string) {
    setPending(id);
    const result = await approveAccessRequest(id);
    if (result.success) {
      toast.success("Access approved");
    } else {
      toast.error(result.error ?? "Failed to approve");
    }
    setPending(null);
  }

  async function handleDeny(id: string) {
    setPending(id);
    const result = await denyAccessRequest(id);
    if (result.success) {
      toast.success("Request denied");
    } else {
      toast.error(result.error ?? "Failed to deny");
    }
    setPending(null);
  }

  return (
    <div className="space-y-8">
      {/* Pending requests */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" />
          Pending ({pending_requests.length})
        </h2>
        {pending_requests.length === 0 ? (
          <p className="text-sm text-muted-foreground border rounded-lg p-6 text-center">
            No pending requests.
          </p>
        ) : (
          <div className="space-y-3">
            {pending_requests.map((req) => (
              <div key={req.id} className="border rounded-lg p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{req.organization.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{req.email}</p>
                  {req.reason && (
                    <p className="text-sm mt-2 bg-muted/50 rounded p-2">{req.reason}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Requested {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleApprove(req.id)}
                    disabled={pending === req.id}
                    className="inline-flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleDeny(req.id)}
                    disabled={pending === req.id}
                    className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolved requests */}
      {resolved_requests.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">History</h2>
          <div className="space-y-2">
            {resolved_requests.map((req) => (
              <div key={req.id} className="border rounded-lg p-4 flex items-center justify-between gap-4 opacity-70">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{req.organization.name}</span>
                    <span className="text-xs text-muted-foreground">({req.email})</span>
                  </div>
                  {req.reason && (
                    <p className="text-xs text-muted-foreground">{req.reason}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    req.status === "APPROVED"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {req.status === "APPROVED" ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {req.status}
                  </span>
                  {req.respondedAt && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(req.respondedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
