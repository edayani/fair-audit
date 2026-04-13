import { getAllAccessRequests } from "@/actions/access-request";
import { AdminRequestsTable } from "@/components/admin/requests-table";

export default async function AdminRequestsPage() {
  const requests = await getAllAccessRequests();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Access Requests</h1>
        <p className="text-muted-foreground mt-1">
          Manage organization access requests. Approve to grant full access.
        </p>
      </div>

      <AdminRequestsTable requests={requests} />
    </div>
  );
}
