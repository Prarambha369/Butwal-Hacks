import { notFound, redirect } from "next/navigation";
import { getImpactReport } from "@/lib/actions/impact";

export const dynamic = "force-dynamic";

/**
 * Legacy /projects/impact/[id] — folded into the project page's Impact
 * section. Looks up the report's project and redirects there so old
 * backlinks keep working.
 */
export default async function ImpactRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getImpactReport(id);
  const projectId = (report as { project_id?: string } | null)?.project_id;
  if (!report || !projectId) {
    notFound();
  }
  redirect(`/projects/${projectId}#impact`);
}
