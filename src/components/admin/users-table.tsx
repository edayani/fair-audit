import { Building2, CheckCircle, Clock, Mail, Shield } from "lucide-react";
import { formatDate, humanize } from "@/lib/utils";

type AdminUser = {
  id: string;
  clerkUserId: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
  organization: {
    id: string;
    name: string;
    accessTier: string;
    accessRequests: Array<{
      status: string;
      createdAt: Date;
      respondedAt: Date | null;
    }>;
  };
};

function getMembershipStatus(user: AdminUser) {
  const latestRequest = user.organization.accessRequests[0];

  if (user.organization.accessTier === "FULL") {
    return {
      label: "Full Access",
      classes: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    };
  }

  if (latestRequest?.status === "PENDING") {
    return {
      label: "Pending Request",
      classes: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    };
  }

  if (latestRequest?.status === "DENIED") {
    return {
      label: "Preview Only",
      classes: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };
  }

  return {
    label: "Preview Only",
    classes: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  };
}

export function AdminUsersTable({ users }: { users: AdminUser[] }) {
  const fullAccessCount = users.filter((user) => user.organization.accessTier === "FULL").length;
  const previewCount = users.length - fullAccessCount;
  const pendingCount = users.filter((user) => user.organization.accessRequests[0]?.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total signed up users</p>
          <p className="mt-2 text-2xl font-semibold">{users.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Users with full access</p>
          <p className="mt-2 text-2xl font-semibold">{fullAccessCount}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Pending access requests</p>
          <p className="mt-2 text-2xl font-semibold">{pendingCount}</p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
          No signed up users found yet.
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/40">
                <tr className="text-left text-sm">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Organization</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Access</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Latest Request</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card text-sm">
                {users.map((user) => {
                  const membershipStatus = getMembershipStatus(user);
                  const latestRequest = user.organization.accessRequests[0];

                  return (
                    <tr key={user.id}>
                      <td className="px-4 py-4 align-top">
                        <div className="font-medium">{user.name || "Unnamed user"}</div>
                        <div className="text-muted-foreground">{user.email}</div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="font-medium">{user.organization.name}</div>
                        <div className="text-muted-foreground">{humanize(user.organization.accessTier)}</div>
                      </td>
                      <td className="px-4 py-4 align-top">{humanize(user.role)}</td>
                      <td className="px-4 py-4 align-top">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${membershipStatus.classes}`}>
                          {membershipStatus.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-4 align-top text-muted-foreground">
                        {latestRequest ? `${humanize(latestRequest.status)} on ${formatDate(latestRequest.createdAt)}` : "No request"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {users.map((user) => {
              const membershipStatus = getMembershipStatus(user);
              const latestRequest = user.organization.accessRequests[0];

              return (
                <div key={user.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium">{user.name || "Unnamed user"}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${membershipStatus.classes}`}>
                      {membershipStatus.label}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>{user.organization.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span>{humanize(user.role)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Joined {formatDate(user.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="h-4 w-4" />
                      <span>{humanize(user.organization.accessTier)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{latestRequest ? `${humanize(latestRequest.status)} on ${formatDate(latestRequest.createdAt)}` : "No access request"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            This list comes from user membership records synced into your database. If someone signed in but never joined an organization, they may not appear here.
          </p>
          <p className="text-xs text-muted-foreground">
            Preview users: {previewCount}
          </p>
        </>
      )}
    </div>
  );
}
