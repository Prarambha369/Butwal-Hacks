"use server";

import { logger } from "@/lib/logger"
import { createClient } from "@/utils/supabase/server";


export async function getProjectDetails(id: string) {
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      profiles (
        id,
        full_name,
        avatar_url,
        bh_id
      ),
      teams (
        id,
        name,
        members (
          profiles (
            id,
            full_name,
            avatar_url,
            bh_id
          )
        )
      ),
      project_likes(count)
    `)
    .eq('id', id)
    .single();

  if (error || !project) {
    logger.error("Error fetching project details:", error);
    return null;
  }

  return project;
}
