import { NextRequest, NextResponse } from "next/server"
import { auth0 } from "@/lib/auth0"
import { createServiceClient } from "@/utils/supabase/service"
import { withRateLimit } from "@/lib/rate-limiter"
import { z } from "zod"

// ─── Validation Schema ──────────────────────────────────────────────────

const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(["todo", "in_progress", "review", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assignee_id: z.string().uuid().nullable().optional(),
  due_date: z.string().datetime().nullable().optional(),
  position: z.number().int().min(0).optional(),
})

// ─── Helpers ────────────────────────────────────────────────────────────

async function getUserProfile(auth0UserId: string) {
  const db = createServiceClient()
  const { data } = await db
    .from("profiles")
    .select("id, role")
    .eq("auth0_user_id", auth0UserId)
    .single()
  return data
}

async function verifyTaskAccess(profileId: string, taskId: string) {
  const db = createServiceClient()
  const { data: task } = await db
    .from("tasks")
    .select("id, workspace_id, workspace:workspaces!inner(team_id)")
    .eq("id", taskId)
    .single()

  if (!task) return null

  const { data: membership } = await db
    .from("team_members")
    .select("id")
    .eq("team_id", (task.workspace as any).team_id)
    .eq("user_id", profileId)
    .maybeSingle()

  return membership ? task : null
}

// ─── PATCH /api/tasks/[id] ──────────────────────────────────────────────

async function handlePatch(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth0.getSession()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const profile = await getUserProfile(session.user.sub)
  if (!profile) {
    return NextResponse.json({ error: "Profile not found. Finish onboarding first." }, { status: 404 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const parsed = UpdateTaskSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  // Verify task access
  const task = await verifyTaskAccess(profile.id, id)
  if (!task) {
    return NextResponse.json({ error: "Task not found or access denied" }, { status: 404 })
  }

  const db = createServiceClient()
  const updateData: Record<string, unknown> = {}

  if (parsed.data.title !== undefined) updateData.title = parsed.data.title
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status
  if (parsed.data.priority !== undefined) updateData.priority = parsed.data.priority
  if (parsed.data.assignee_id !== undefined) updateData.assignee_id = parsed.data.assignee_id
  if (parsed.data.due_date !== undefined) updateData.due_date = parsed.data.due_date
  if (parsed.data.position !== undefined) updateData.position = parsed.data.position

  // If status changed and no explicit position, append to the end of the new column
  if (parsed.data.status && parsed.data.position === undefined) {
    const { data: lastTask } = await db
      .from("tasks")
      .select("position")
      .eq("workspace_id", task.workspace_id)
      .eq("status", parsed.data.status)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle()

    updateData.position = (lastTask?.position ?? -1) + 1
  }

  const { data: updated, error } = await db
    .from("tasks")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ task: updated })
}

export const PATCH = withRateLimit(handlePatch, "frequent");

// ─── DELETE /api/tasks/[id] ─────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth0.getSession()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const profile = await getUserProfile(session.user.sub)
  if (!profile) {
    return NextResponse.json({ error: "Profile not found. Finish onboarding first." }, { status: 404 })
  }

  const { id } = await params

  // Verify task access
  const task = await verifyTaskAccess(profile.id, id)
  if (!task) {
    return NextResponse.json({ error: "Task not found or access denied" }, { status: 404 })
  }

  const db = createServiceClient()
  const { error } = await db
    .from("tasks")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
