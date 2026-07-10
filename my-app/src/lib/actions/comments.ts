"use server"

// ponytail: placeholder — implement with Supabase when comments are needed.

type Comment = {
  id: string
  content: string
  created_at: string
  profiles: { full_name?: string; avatar_url?: string } | null
}

export async function getComments(projectId: string): Promise<Comment[]> {
  // TODO: fetch from Supabase
  if (!projectId) return []
  return []
}

export async function postComment(_projectId: string, _content: string): Promise<{ success: boolean; comment?: Comment }> {
  // TODO: insert into Supabase
  return {
    success: true,
    comment: {
      id: crypto.randomUUID(),
      content: _content,
      created_at: new Date().toISOString(),
      profiles: null,
    },
  }
}
