"use server";

import { logger } from "@/lib/logger"
import { createServiceClient } from "@/utils/supabase/service";
import { revalidatePath } from "next/cache";
import { sanitizeString, normalizeSocialUrl } from "@/lib/validation";
import { auth0 } from "@/lib/auth0";

export async function updateProfile(userId: string, updates: { 
  full_name?: string; 
  bio?: string; 
  avatar_url?: string | null; 
  open_to_mentor?: boolean;
  cal_com_url?: string;
  socials?: { 
    github?: string; 
    linkedin?: string; 
    twitter?: string; 
    website?: string; 
  } 
}) {
  const session = await auth0.getSession();
  if (!session?.user) throw new Error("Unauthorized");
  const supabase = createServiceClient();

  // Sanitize all string fields — discard invalid URLs entirely
  const normalizeOptionalUrl = (val: string | undefined): string | undefined =>
    val ? normalizeSocialUrl(val) ?? undefined : undefined

  const sanitized = {
    ...updates,
    full_name: updates.full_name ? sanitizeString(updates.full_name, 100) : updates.full_name,
    bio: updates.bio ? sanitizeString(updates.bio, 2000) : updates.bio,
    avatar_url: updates.avatar_url ? normalizeSocialUrl(updates.avatar_url) ?? null : updates.avatar_url,
    open_to_mentor: updates.open_to_mentor !== undefined ? updates.open_to_mentor : undefined,
    cal_com_url: updates.cal_com_url !== undefined ? normalizeSocialUrl(updates.cal_com_url) ?? null : undefined,
    socials: updates.socials ? {
      github: normalizeOptionalUrl(updates.socials.github),
      linkedin: normalizeOptionalUrl(updates.socials.linkedin),
      twitter: normalizeOptionalUrl(updates.socials.twitter),
      website: normalizeOptionalUrl(updates.socials.website),
    } : undefined,
  }
  
  const { error } = await supabase
    .from('profiles')
    .update(sanitized)
    .eq('auth0_user_id', userId);

  if (error) {
    logger.error('Error updating profile:', error);
    throw new Error('Failed to update profile');
  }

  revalidatePath('/dashboard/hacker/profile');
  revalidatePath(`/profile/${userId}`);
  return { success: true };
}
