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
