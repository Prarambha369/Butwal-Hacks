"use server";

import { createClient } from "@/utils/supabase/server";

export async function getImpactReport(reportId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("impact_reports")
    .select(`*, projects (*)`)
    .eq("id", reportId)
    .single();

  if (error) return null;
  return data;
}
