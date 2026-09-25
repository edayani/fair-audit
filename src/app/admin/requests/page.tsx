import { getAllAccessRequests, getAllSignedUpUsers } from "@/actions/access-request";
import { AdminRequestsTable } from "@/components/admin/requests-table";
import { AdminUsersTable } from "@/components/admin/users-table";
import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "Access requests" };

export default async function AdminRequestsPage() {
  const [requests, users] = await Promise.all([
    getAllAccessRequests(),
    getAllSignedUpUsers(),
  ]);

  return (
    <div className="space-y-12">
      <PageHeader eyebrow="Platform admin" title="Access requests" description="Review preview workspaces requesting full access and approve or deny each request." />

      <AdminRequestsTable requests={requests} />

      <section>
        <PageHeader title="Members" description="Everyone who has joined FairAudit, with their organization and access tier." />

        <AdminUsersTable users={users} />
      </section>
    </div>
  );
}
