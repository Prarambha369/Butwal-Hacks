"use server";

import { createServiceClient } from "@/utils/supabase";

export async function getImpactReport(reportId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("impact_reports")
    .select(`*, projects (*)`)
    .eq("id", reportId)
    .single();

  if (error) return null;
  return data;
}

/** Latest impact report for a project (for the embedded Impact section). */
export async function getLatestImpactReport(projectId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("impact_reports")
    .select(`id, score, metrics, generated_at`)
    .eq("project_id", projectId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data;
}
