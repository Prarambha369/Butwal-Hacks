import { NextRequest, NextResponse } from "next/server"
import { auth0 } from "@/lib/auth0"
import { createServiceClient } from "@/utils/supabase/service"
import { withRateLimit } from "@/lib/rate-limiter"
import { z } from "zod"

// ─── Validation Schemas ────────────────────────────────────────────────

const CreateTaskSchema = z.object({
  workspace_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).default(""),
  status: z.enum(["todo", "in_progress", "review", "done"]).default("todo"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  assignee_id: z.string().uuid().nullable().optional(),
  due_date: z.string().datetime().nullable().optional(),
})

const ListTasksSchema = z.object({
  workspace_id: z.string().uuid(),
  status: z.enum(["todo", "in_progress", "review", "done"]).optional(),
  assignee_id: z.string().uuid().optional(),
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

async function verifyWorkspaceAccess(profileId: string, workspaceId: string) {
  const db = createServiceClient()
  const { data: workspace } = await db
    .from("workspaces")
    .select("id, team_id")
    .eq("id", workspaceId)
    .single()

  if (!workspace) return false

  const { data: membership } = await db
    .from("team_members")
    .select("id")
    .eq("team_id", workspace.team_id)
    .eq("user_id", profileId)
    .maybeSingle()

  return !!membership
}

// ─── GET /api/tasks ─────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const session = await auth0.getSession()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const profile = await getUserProfile(session.user.sub)
  if (!profile) {
    return NextResponse.json({ error: "Profile not found. Finish onboarding first." }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const parsed = ListTasksSchema.safeParse({
    workspace_id: searchParams.get("workspace_id"),
    status: searchParams.get("status") || undefined,
    assignee_id: searchParams.get("assignee_id") || undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  // Verify workspace access
  const hasAccess = await verifyWorkspaceAccess(profile.id, parsed.data.workspace_id)
  if (!hasAccess) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  }

  const db = createServiceClient()
  let query = db
    .from("tasks")
    .select("*")
    .eq("workspace_id", parsed.data.workspace_id)
    .order("position", { ascending: true })

  if (parsed.data.status) {
    query = query.eq("status", parsed.data.status)
  }
  if (parsed.data.assignee_id) {
    query = query.eq("assignee_id", parsed.data.assignee_id)
  }

  const { data: tasks, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ tasks })
}

// ─── POST /api/tasks ────────────────────────────────────────────────────

async function handlePost(request: NextRequest) {
  const session = await auth0.getSession()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const profile = await getUserProfile(session.user.sub)
  if (!profile) {
    return NextResponse.json({ error: "Profile not found. Finish onboarding first." }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = CreateTaskSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  // Verify workspace access
  const hasAccess = await verifyWorkspaceAccess(profile.id, parsed.data.workspace_id)
  if (!hasAccess) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  }

  const db = createServiceClient()

  // Get the next position for this status column
  const { data: lastTask } = await db
    .from("tasks")
    .select("position")
    .eq("workspace_id", parsed.data.workspace_id)
    .eq("status", parsed.data.status)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextPosition = (lastTask?.position ?? -1) + 1

  const { data: task, error } = await db
    .from("tasks")
    .insert({
      workspace_id: parsed.data.workspace_id,
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status,
      priority: parsed.data.priority,
      assignee_id: parsed.data.assignee_id || null,
      due_date: parsed.data.due_date || null,
      position: nextPosition,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ task }, { status: 201 })
}

export const POST = withRateLimit(handlePost, "bulk");
