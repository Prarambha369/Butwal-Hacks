"use server"

// ponytail: placeholder — implement with Supabase curation logic when needed.

export async function nominateProject(projectId: string): Promise<{ success: boolean; error?: string }> {
  // TODO: implement actual nomination logic
  if (!projectId) return { success: false, error: "Project not found" }
  return { success: true }
}
