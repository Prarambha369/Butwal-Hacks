import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { createClient } from "@/utils/supabase/server";
import { ScrollText } from "lucide-react";
import AuditLogPanel from "@/components/dashboard/maintainer/audit-log-panel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit Log — Maintainer",
  description: "Full system audit trail of all actions across the platform.",
};

export default async function AuditLogPage(props: {
  searchParams?: Promise<{ p?: string; action?: string }>;
}) {
  const session = await auth0.getSession();
  if (!session?.user) redirect("/auth/login");

  const searchParams = await props.searchParams;
  const page = Math.max(1, parseInt(searchParams?.p ?? "1", 10) || 1);
  const actionFilter = searchParams?.action ?? "all";
  const pageSize = 25;

  const supabase = await createClient();

  // Get total count (respect action filter)
  let countQuery = supabase.from("audit_logs").select("*", { count: "exact", head: true });
  if (actionFilter !== "all") {
    countQuery = countQuery.eq("action", actionFilter);
  }
  const { count: total } = await countQuery;

  // Fetch paginated entries with actor profiles
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let dataQuery = supabase
    .from("audit_logs")
    .select(`
      *,
      profiles!audit_logs_actor_id_fkey ( full_name, avatar_url, bh_id )
    `)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (actionFilter !== "all") {
    dataQuery = dataQuery.eq("action", actionFilter);
  }

  const { data: rows } = await dataQuery;

  // Flatten profile into actor fields
  const entries = (rows || []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: row.id,
      created_at: row.created_at,
      action: row.action,
      target_type: row.target_type,
      target_id: row.target_id,
      metadata: row.metadata as Record<string, unknown> | null,
      actor_name: (profile as { full_name?: string } | null)?.full_name ?? null,
      actor_avatar: (profile as { avatar_url?: string } | null)?.avatar_url ?? null,
      actor_bh_id: (profile as { bh_id?: string } | null)?.bh_id ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5 mb-1">
          <ScrollText className="w-5 h-5 text-primary-red" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary-red">Audit</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Audit Log</h1>
        <p className="text-sm text-muted-foreground">
          Full system audit trail of all actions across the platform.
        </p>
      </div>

      <AuditLogPanel
        entries={entries}
        total={total ?? 0}
        page={page}
        pageSize={pageSize}
      />
    </div>
  );
}
