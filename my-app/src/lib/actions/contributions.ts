"use server"

// ponytail: placeholder — implement with Supabase when contributions are needed.

export async function getProjectContributions(
  projectId: string
): Promise<Array<{ profile_id: string; role: string; contribution: string }>> {
  // TODO: fetch from Supabase
  if (!projectId) return []
  return []
}

export async function updateContribution(
  _projectId: string,
  _profileId: string,
  _role: string,
 _contribution: string
): Promise<{ success: boolean }> {
  // TODO: update in Supabase
  return { success: true }
}
