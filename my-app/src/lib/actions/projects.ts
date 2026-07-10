"use server";

import { logger } from "@/lib/logger"
import { createServiceClient } from "@/utils/supabase/service";
import { revalidatePath } from "next/cache";

import { auth0 } from "@/lib/auth0";
import type { ProjectCategory } from "@/lib/supabase-types";

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
  
  const session = await auth0.getSession();
  if (!session?.user) throw new Error("You must be signed in to submit a project");
  const userId = session.user.sub;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth0_user_id', userId)
    .single();

  if (!profile) throw new Error("Profile not found for this user");

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
      profile_id: profile.id,
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
  
  const session = await auth0.getSession();
  if (!session?.user) throw new Error("You must be signed in to like a project");
  const userId = session.user.sub;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth0_user_id', userId)
    .single();

  if (!profile) throw new Error("Profile not found");

  // Check if already liked
  const { data: existing } = await supabase
    .from('project_likes')
    .select('id')
    .eq('project_id', projectId)
    .eq('profile_id', profile.id)
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
      .insert({ project_id: projectId, profile_id: profile.id });

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
  
  const session = await auth0.getSession();
  if (!session?.user) throw new Error("You must be signed in to update a project");
  const userId = session.user.sub;

  // Verify ownership
  const { data: project } = await supabase
    .from('projects')
    .select('profile_id')
    .eq('id', projectId)
    .single();

  if (!project) throw new Error("Project not found");

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth0_user_id', userId)
    .single();

  if (!profile || project.profile_id !== profile.id) {
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

  const session = await auth0.getSession();
  if (!session?.user) throw new Error("You must be signed in to delete a project");
  const userId = session.user.sub;

  // Resolve profile UUID
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth0_user_id', userId)
    .single();

  if (!profile) throw new Error("Profile not found");

  // Verify ownership
  const { data: project } = await supabase
    .from('projects')
    .select('profile_id')
    .eq('id', projectId)
    .single();

  if (!project) throw new Error("Project not found");

  if (project.profile_id !== profile.id) {
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
