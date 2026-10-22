"use server";

import { logger } from "@/lib/logger"
import { createServiceClient } from "@/utils/supabase";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth0 } from "@/lib/auth0";
import type { ProjectCategory } from "@/lib/supabase-types";
import { PROJECT_CATEGORIES } from "@/lib/supabase-types";
import { resolveProfileId, resolveProfileIdFromSub } from "@/lib/profile-resolver";
import { sanitizeString, sanitizeUrl, sanitizeUuid } from "@/lib/validation";
import { isPrizeCategory } from "@/lib/prize-categories";

/**
 * Submission payload.
 *
 * The rules acceptance and the public-code attestation are required: a
 * project that was not built during the event, or whose code cannot be
 * reviewed, cannot be judged or win a prize. See `policies/HACKATHON_RULES.md`.
 */
const submitProjectSchema = z.object({
  title: z.string().min(3).transform(v => sanitizeString(v, 200)),
  description: z.string().min(10).transform(v => sanitizeString(v, 2000)),
  demoUrl: z.string().optional().transform(v => (v ? sanitizeUrl(v) ?? "" : "")),
  githubUrl: z.string().optional().transform(v => (v ? sanitizeUrl(v) ?? "" : "")),
  videoUrl: z.string().optional().transform(v => (v ? sanitizeUrl(v) ?? "" : "")),
  coverImage: z.string().optional().transform(v => (v ? sanitizeUrl(v) ?? "" : "")),
  techStack: z
    .array(z.string())
    .min(1, "Add at least one technology")
    .transform(v => v.map(t => sanitizeString(t, 50)).filter(Boolean)),
  eventId: z
    .string()
    .nullable()
    .optional()
    .transform(v => (v ? sanitizeUuid(v) ?? null : null)),
  teamId: z
    .string()
    .nullable()
    .optional()
    .transform(v => (v ? sanitizeUuid(v) ?? null : null)),
  category: z
    .enum(PROJECT_CATEGORIES as [ProjectCategory, ...ProjectCategory[]])
    .nullable()
    .optional(),
  rulesAccepted: z.boolean().refine(v => v === true, {
    message: "You must accept the hackathon rules to submit",
  }),
  publicCodeAttested: z.boolean().refine(v => v === true, {
    message: "The code for this project has to be publicly available",
  }),
  prizeCategories: z
    .array(z.string())
    .max(10)
    .optional()
    .default([])
    .transform(v => v.filter(isPrizeCategory)),
  aiTools: z
    .array(z.string())
    .max(20)
    .optional()
    .default([])
    .transform(v => v.map(t => sanitizeString(t, 60)).filter(Boolean)),
});

export async function submitProject(formData: {
  title: string;
  description: string;
  demoUrl: string;
  githubUrl: string;
  videoUrl?: string;
  techStack: string[];
  eventId: string | null;
  teamId: string | null;
  coverImage?: string;
  category?: ProjectCategory | null;
  rulesAccepted?: boolean;
  publicCodeAttested?: boolean;
  prizeCategories?: string[];
  aiTools?: string[];
}) {
  // Authenticate before validating: an unauthenticated caller gets
  // "Unauthorized", not a validation error that tells them what the schema
  // expects.
  const session = await auth0.getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = submitProjectSchema.safeParse(formData);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(issue?.message ?? "Invalid project submission");
  }
  const payload = parsed.data;

  const supabase = createServiceClient();
  const profileId = await resolveProfileIdFromSub(session.user.sub);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('projects')
    .insert({
      title: payload.title,
      description: payload.description,
      demo_url: payload.demoUrl || null,
      github_url: payload.githubUrl || null,
      video_url: payload.videoUrl || null,
      tech_stack: payload.techStack,
      category: payload.category || null,
      event_id: payload.eventId,
      team_id: payload.teamId,
      cover_image: payload.coverImage || null,
      github_verified: false,
      profile_id: profileId,
      rules_accepted_at: now,
      public_code_attested: true,
      prize_categories: payload.prizeCategories,
      ai_tools: payload.aiTools,
    })
    .select()
    .single();

  if (error) {
    logger.error("Supabase Project Insert Error:", error);
    throw new Error(error.message);
  }

  revalidatePath('/projects');
  revalidatePath('/dashboard/projects');

  return { success: true, project: data };
}

export async function getUserProjects(userId: string) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_likes(count)
    `)
    .eq('profile_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error("Error fetching user projects:", error);
    return [];
  }

  return data || [];
}

export async function linkProjectToTeam(projectId: string, teamId: string) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('projects')
    .update({ team_id: teamId })
    .eq('id', projectId);

  if (error) throw error;

  revalidatePath('/projects');
  revalidatePath('/dashboard/projects');

  return { success: true };
}

/**
 * Impact metrics for a project.
 *
 * Object-level authorization: the caller must own the project, sit on the
 * owning team, be the event organizer, or hold staff authority. This runs on
 * the service-role client, so without the check any signed-in member could
 * read engagement metrics and the submitter's full name and BH-ID for any
 * project id they could guess.
 *
 * Returns `null` rather than throwing so the caller can answer 403 without the
 * distinction between "forbidden" and "does not exist" leaking.
 */
export async function generateImpactReport(projectId: string) {
  const supabase = createServiceClient();

  // Resolve the caller first. resolveProfileId() is auth-scoped, so an
  // unauthenticated call throws before any project data is read.
  const callerId = await resolveProfileId();
  const { data: caller } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', callerId)
    .single();

  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      id, title, tech_stack, created_at, profile_id, team_id, event_id,
      project_likes(count),
      project_views(count),
      comments:project_comments(count),
      profile:profiles!inner(id, full_name, bh_id)
    `)
    .eq('id', projectId)
    .single();

  if (error || !project) {
    throw new Error('Project not found');
  }

  const isOwner = project.profile_id === callerId;

  let isTeamMember = false;
  if (project.team_id) {
    const { data: membership } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', project.team_id)
      .eq('profile_id', callerId)
      .maybeSingle();
    isTeamMember = !!membership;
  }

  let isEventOrganizer = false;
  if (project.event_id) {
    const { data: event } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', project.event_id)
      .maybeSingle();
    isEventOrganizer = !!event && event.organizer_id === callerId;
  }

  if (!isOwner && !isTeamMember && !isEventOrganizer && caller?.role !== 'maintainer') {
    return null;
  }

  return {
    projectId: project.id,
    title: project.title,
    submittedBy: project.profile,
    likes: project.project_likes?.[0]?.count ?? 0,
    views: project.project_views?.[0]?.count ?? 0,
    comments: project.comments?.[0]?.count ?? 0,
    techStack: project.tech_stack,
    createdAt: project.created_at,
  };
}

export async function toggleProjectLike(projectId: string) {
  const supabase = createServiceClient();
  const profileId = await resolveProfileId();

  // Check if already liked
  const { data: existing } = await supabase
    .from('project_likes')
    .select('id')
    .eq('project_id', projectId)
    .eq('profile_id', profileId)
    .single();

  if (existing) {
    // Unlike
    const { error } = await supabase
      .from('project_likes')
      .delete()
      .eq('id', existing.id);

    if (error) throw error;
  } else {
    // Like
    const { error } = await supabase
      .from('project_likes')
      .insert({ project_id: projectId, profile_id: profileId });

    if (error) throw error;
  }

  revalidatePath('/projects');
  return { success: true };
}

const updateProjectSchema = z.object({
  title: z.string().min(3).optional().transform(v => (v ? sanitizeString(v, 200) : v)),
  description: z.string().min(10).optional().transform(v => (v ? sanitizeString(v, 2000) : v)),
  demoUrl: z.string().optional().transform(v => (v ? sanitizeUrl(v) ?? "" : "")),
  githubUrl: z.string().optional().transform(v => (v ? sanitizeUrl(v) ?? "" : "")),
  videoUrl: z.string().optional().transform(v => (v ? sanitizeUrl(v) ?? "" : "")),
  techStack: z
    .array(z.string())
    .min(1, "Add at least one technology")
    .optional()
    .transform(v => (v ? v.map(t => sanitizeString(t, 50)).filter(Boolean) : v)),
  eventId: z
    .string()
    .nullable()
    .optional()
    .transform(v => (v === undefined ? v : v ? sanitizeUuid(v) ?? null : null)),
  coverImage: z.string().optional().transform(v => (v ? sanitizeUrl(v) ?? "" : "")),
  category: z
    .enum(PROJECT_CATEGORIES as [ProjectCategory, ...ProjectCategory[]])
    .nullable()
    .optional(),
  prizeCategories: z
    .array(z.string())
    .max(10)
    .optional()
    .transform(v => (v ? v.filter(isPrizeCategory) : v)),
  aiTools: z
    .array(z.string())
    .max(20)
    .optional()
    .transform(v => (v ? v.map(t => sanitizeString(t, 60)).filter(Boolean) : v)),
});

export async function updateProject(projectId: string, formData: {
  title?: string;
  description?: string;
  demoUrl?: string;
  githubUrl?: string;
  videoUrl?: string;
  techStack?: string[];
  eventId?: string | null;
  coverImage?: string;
  category?: string | null;
  prizeCategories?: string[];
  aiTools?: string[];
}) {
  const session = await auth0.getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const parsed = updateProjectSchema.safeParse(formData);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(issue?.message ?? "Invalid project update");
  }
  const data = parsed.data;

  const supabase = createServiceClient();
  const profileId = await resolveProfileIdFromSub(session.user.sub);

  // Verify ownership
  const { data: project } = await supabase
    .from('projects')
    .select('profile_id')
    .eq('id', projectId)
    .single();

  if (!project) throw new Error("Project not found");

  if (project.profile_id !== profileId) {
    throw new Error("You can only edit your own projects");
  }

  const updates: Record<string, unknown> = {};
  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.demoUrl !== undefined) updates.demo_url = data.demoUrl;
  if (data.githubUrl !== undefined) updates.github_url = data.githubUrl;
  if (data.videoUrl !== undefined) updates.video_url = data.videoUrl;
  if (data.techStack !== undefined) updates.tech_stack = data.techStack;
  if (data.eventId !== undefined) updates.event_id = data.eventId;
  if (data.coverImage !== undefined) updates.cover_image = data.coverImage;
  if (data.category !== undefined) updates.category = data.category;
  if (data.prizeCategories !== undefined) updates.prize_categories = data.prizeCategories;
  if (data.aiTools !== undefined) updates.ai_tools = data.aiTools;

  const { data: updated, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single();

  if (error) {
    logger.error("Supabase Project Update Error:", error);
    throw new Error(error.message);
  }

  revalidatePath('/projects');
  revalidatePath('/dashboard/projects');
  revalidatePath(`/dashboard/hacker/projects`);

  return { success: true, project: updated };
}

export async function deleteProject(projectId: string) {
  const supabase = createServiceClient();
  const profileId = await resolveProfileId();

  // Verify ownership
  const { data: project } = await supabase
    .from('projects')
    .select('profile_id')
    .eq('id', projectId)
    .single();

  if (!project) throw new Error("Project not found");

  if (project.profile_id !== profileId) {
    throw new Error("You can only delete your own projects");
  }

  // Delete related records first to avoid FK violations
  await supabase.from('project_likes').delete().eq('project_id', projectId);

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    logger.error("Supabase Project Delete Error:", error);
    throw new Error(error.message);
  }

  revalidatePath('/projects');
  revalidatePath('/dashboard/projects');
  revalidatePath('/dashboard/hacker/projects');

  return { success: true };
}

interface PaginatedResult<T> {
  data: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ProjectListItem {
  id: string
  title: string
  description: string | null
  tech_stack: string[]
  category: string | null
  created_at: string
  profile_name: string | null
  profile_initials: string
}

/**
 * Fetch a paginated, filtered, and sorted list of projects for the current user.
 * All heavy lifting (filtering, sorting, counting) happens on the server via Supabase.
 */
export async function getPaginatedProjects(params: {
  profileId: string
  teamIds: string[]
  page?: number
  pageSize?: number
  search?: string
  category?: string
  sortKey?: "title" | "category" | "created_at"
  sortDir?: "asc" | "desc"
}): Promise<PaginatedResult<ProjectListItem>> {
  const {
    profileId,
    teamIds,
    page = 0,
    pageSize = 10,
    search = "",
    category = "",
    sortKey = "created_at",
    sortDir = "desc",
  } = params

  const supabase = createServiceClient()

  // Build the base query
  let query = supabase
    .from("projects")
    .select(`
      id,
      title,
      description,
      tech_stack,
      category,
      created_at,
      profile:profiles(full_name)
    `, { count: "exact" })

  // Guard empty teamIds — team_id.in.() is invalid PostgREST syntax
  if (teamIds.length > 0) {
    query = query.or(`profile_id.eq.${profileId},team_id.in.(${teamIds.join(",")})`)
  } else {
    query = query.eq("profile_id", profileId)
  }

  // Apply filters
  if (search.trim()) {
    query = query.ilike("title", `%${search.trim()}%`)
  }
  if (category) {
    query = query.eq("category", category)
  }

  // Apply sorting — only sort by columns that exist in the projects table
  const sortColumnMap: Record<string, string> = {
    title: "title",
    category: "category",
    created_at: "created_at",
  }
  const column = sortColumnMap[sortKey] || "created_at"
  query = query.order(column, { ascending: sortDir === "asc" })

  // Apply pagination
  const from = page * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    logger.error("Error fetching paginated projects:", error)
    return { data: [], totalCount: 0, page, pageSize, totalPages: 0 }
  }

  // Transform to ProjectListItem with profile initials
  type RawProject = {
    id: string
    title: string
    description: string | null
    tech_stack: string[]
    category: string | null
    created_at: string
    profile: { full_name: string | null } | { full_name: string | null }[] | null
  }

  const transformed: ProjectListItem[] = ((data || []) as RawProject[]).map((p) => {
    const profileData = Array.isArray(p.profile) ? p.profile[0] : p.profile
    const profileName = profileData?.full_name || null
    const initials = profileName
      ? profileName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
      : "??"
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      tech_stack: p.tech_stack || [],
      category: p.category,
      created_at: p.created_at,
      profile_name: profileName,
      profile_initials: initials,
    }
  })

  const totalCount = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return {
    data: transformed,
    totalCount,
    page,
    pageSize,
    totalPages,
  }
}

export async function getFeaturedProjects(limit = 3) {
  const supabase = createServiceClient();

  let query = supabase
    .from('projects')
    .select(`
      *,
      project_likes(count)
    `)
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  // Fail fast on DB stalls — callers render empty states on [].
  const { data, error } = await query.abortSignal(AbortSignal.timeout(5000));

  if (error) {
    logger.error("Error fetching projects:", error);
    return [];
  }

  return data;
}

/** Community-verified projects, newest first. Backs the /projects featured strip. */
export async function getVerifiedProjects(limit = 3) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('projects')
    .select('id, title, description, cover_image, event_id')
    .eq('github_verified', true)
    .order('created_at', { ascending: false })
    .limit(limit)
    .abortSignal(AbortSignal.timeout(5000));

  if (error) {
    logger.error("Error fetching verified projects:", error);
    return [];
  }

  return data;
}
