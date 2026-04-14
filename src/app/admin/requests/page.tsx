import { getAllAccessRequests, getAllSignedUpUsers } from "@/actions/access-request";
import { AdminRequestsTable } from "@/components/admin/requests-table";
import { AdminUsersTable } from "@/components/admin/users-table";

export default async function AdminRequestsPage() {
  const [requests, users] = await Promise.all([
    getAllAccessRequests(),
    getAllSignedUpUsers(),
  ]);

  return (
    <div className="space-y-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Access Requests</h1>
        <p className="text-muted-foreground mt-1">
          Manage organization access requests. Approve to grant full access.
        </p>
      </div>

      <AdminRequestsTable requests={requests} />

      <section>
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Signed Up Users</h2>
          <p className="text-muted-foreground mt-1">
            Review who has joined FairAudit and which organization and access tier they belong to.
          </p>
        </div>

        <AdminUsersTable users={users} />
      </section>
    </div>
  );
}
