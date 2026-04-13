import { getApplicants } from "@/actions/application";
import { PageHeader } from "@/components/shared/page-header";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default async function ApplicantsPage() {
  const applicants = await getApplicants();

  return (
    <div>
      <PageHeader title="Applicants" description="All applicants in the system" />
      {applicants.length === 0 ? (
        <p className="text-muted-foreground">No applicants. Use Demo Mode to populate sample data.</p>
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Name</th>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Email</th>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Applications</th>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((a) => (
                <tr key={a.id} className="border-b hover:bg-muted/50">
                  <td className="p-4"><Link href={`/dashboard/applicants/${a.id}`} className="font-medium hover:underline">{a.firstName} {a.lastName}</Link></td>
                  <td className="p-4 text-muted-foreground">{a.email ?? "N/A"}</td>
                  <td className="p-4">{a._count.applications}</td>
                  <td className="p-4 text-muted-foreground">{formatDate(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
