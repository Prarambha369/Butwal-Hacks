"use server";

import { logger } from "@/lib/logger"
import { createServiceClient } from "@/utils/supabase/service";
import { revalidatePath } from "next/cache";
import type { ProjectCategory } from "@/lib/supabase-types";
import { resolveProfileId } from "@/lib/profile-resolver";

export async function submitProject(formData: {
  title: string;
  description: string;
  demoUrl: string;
  githubUrl: string;
  techStack: string[];
  eventId: string | null;
  teamId: string | null;
  coverImage?: string;
  category?: ProjectCategory | null;
}) {
  const supabase = createServiceClient();
  const profileId = await resolveProfileId();

  const { data, error } = await supabase
    .from('projects')
    .insert({
      title: formData.title,
      description: formData.description,
      demo_url: formData.demoUrl,
      github_url: formData.githubUrl,
      tech_stack: formData.techStack,
      category: formData.category || null,
      event_id: formData.eventId,
      team_id: formData.teamId,
      cover_image: formData.coverImage || null,
      github_verified: false,
      profile_id: profileId,
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

export async function generateImpactReport(projectId: string) {
  const supabase = createServiceClient();

  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
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

export async function updateProject(projectId: string, formData: {
  title?: string;
  description?: string;
  demoUrl?: string;
  githubUrl?: string;
  techStack?: string[];
  eventId?: string | null;
  coverImage?: string;
  category?: string | null;
}) {
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
    throw new Error("You can only edit your own projects");
  }

  const updates: Record<string, unknown> = {};
  if (formData.title !== undefined) updates.title = formData.title;
  if (formData.description !== undefined) updates.description = formData.description;
  if (formData.demoUrl !== undefined) updates.demo_url = formData.demoUrl;
  if (formData.githubUrl !== undefined) updates.github_url = formData.githubUrl;
  if (formData.techStack !== undefined) updates.tech_stack = formData.techStack;
  if (formData.eventId !== undefined) updates.event_id = formData.eventId;
  if (formData.coverImage !== undefined) updates.cover_image = formData.coverImage;
  if (formData.category !== undefined) updates.category = formData.category;

  const { data, error } = await supabase
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
  
  return { success: true, project: data };
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

export interface PaginatedResult<T> {
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

  const { data, error } = await query;

  if (error) {
    logger.error("Error fetching projects:", error);
    return [];
  }

  return data;
}
