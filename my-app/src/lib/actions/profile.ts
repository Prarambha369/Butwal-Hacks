"use server";

import { logger } from "@/lib/logger"
import { createServiceClient } from "@/utils/supabase/service";
import { revalidatePath } from "next/cache";
import {sanitizeName, sanitizeDescription, sanitizeUrl} from "@/lib/validation";
import { auth0 } from "@/lib/auth0";

export async function updateProfile(userId: string, updates: { 
  full_name?: string; 
  bio?: string; 
  avatar_url?: string | null; 
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

  // Sanitize all string fields
  const sanitized = {
    ...updates,
    full_name: updates.full_name ? sanitizeName(updates.full_name) : updates.full_name,
    bio: updates.bio ? sanitizeDescription(updates.bio) : updates.bio,
    avatar_url: updates.avatar_url ? sanitizeUrl(updates.avatar_url) ?? updates.avatar_url : updates.avatar_url,
    socials: updates.socials ? {
      github: updates.socials.github ? sanitizeUrl(updates.socials.github) ?? updates.socials.github : undefined,
      linkedin: updates.socials.linkedin ? sanitizeUrl(updates.socials.linkedin) ?? updates.socials.linkedin : undefined,
      twitter: updates.socials.twitter ? sanitizeUrl(updates.socials.twitter) ?? updates.socials.twitter : undefined,
      website: updates.socials.website ? sanitizeUrl(updates.socials.website) ?? updates.socials.website : undefined,
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
