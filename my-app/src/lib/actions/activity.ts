"use server";

import { createClient } from "@/utils/supabase/server";

export async function getRecentActivity(page = 0, pageSize = 20) {
  const supabase = await createClient();
  const from = page * pageSize;
  const to = from + pageSize - 1;

  // ponytail: range() for cursor-based pagination instead of unbounded fetch
  const { data, error } = await supabase
    .from("audit_logs")
    .select(`
      *,
      profiles (
        full_name,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  // Map audit logs to human-readable messages
  return (data || []).map(log => {
    let message = "performed an action";
    if (log.action === 'XP_AWARDED') message = `earned XP!`;
    if (log.action === 'PROJECT_SUBMITTED') message = `shipped a new project!`;
    if (log.action === 'BADGE_EARNED') message = `earned a new trust marker!`;
    if (log.action === 'TEAM_JOINED') message = `joined a new team!`;

    return {
      id: log.id,
      user: log.profiles,
      message,
      timestamp: log.created_at,
      type: log.action,
    };
  });
}
