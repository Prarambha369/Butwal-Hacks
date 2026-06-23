'use server';

import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { logger } from '@/lib/logger'
import { createServiceClient } from '@/utils/supabase/service';
import { revalidatePath } from 'next/cache';

async function requireMaintainer() {
  const session = await auth0.getSession();
  if (!session?.user) redirect("/auth/login");
  const supabase = createServiceClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("auth0_user_id", session.user.sub)
    .single();
  const userEmail = profile?.email ?? session.user.email ?? "";
  if ((profile?.role as string) !== "maintainer" || !userEmail.endsWith("@butwalhacks.com")) {
    redirect("/dashboard");
  }
  return session.user.sub;
}

export async function updateUserRole(userId: string, newRole: string) {
  await requireMaintainer();
  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)
    .select();

  if (error) {
    logger.error('Error updating user role:', error);
    throw new Error('Failed to update user role');
  }

  revalidatePath('/dashboard/maintainer/users');
  return { success: true, data };
}

/**
 * Soft-revoke a trust marker — sets is_revoked=true and stores the reason.
 * Does NOT delete the marker (maintains the audit trail).
 */
export async function revokeTrustMarker(markerId: string, reason: string) {
  await requireMaintainer();

  if (!reason || reason.trim().length < 5) {
    throw new Error('Revocation reason must be at least 5 characters');
  }

  const supabase = createServiceClient();
  
  const { error } = await supabase
    .from('trust_markers')
    .update({ 
      is_revoked: true, 
      revocation_reason: reason.trim().slice(0, 500),
    })
    .eq('id', markerId);

  if (error) {
    logger.error('Error revoking trust marker:', error);
    throw new Error('Failed to revoke trust marker');
  }

  revalidatePath('/dashboard/maintainer/trust-override');
  revalidatePath('/dashboard/maintainer/users');
  return { success: true };
}

/**
 * Reinstate a previously revoked trust marker.
 */
export async function reinstateTrustMarker(markerId: string) {
  await requireMaintainer();
  const supabase = createServiceClient();
  
  const { error } = await supabase
    .from('trust_markers')
    .update({ 
      is_revoked: false, 
      revocation_reason: null,
    })
    .eq('id', markerId);

  if (error) {
    logger.error('Error reinstating trust marker:', error);
    throw new Error('Failed to reinstate trust marker');
  }

  revalidatePath('/dashboard/maintainer/trust-override');
  revalidatePath('/dashboard/maintainer/users');
  return { success: true };
}

export async function getAdminUserStats() {
  await requireMaintainer();
  const supabase = createServiceClient();
  
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  if (error) {
    logger.error('Error fetching user stats:', error);
    throw new Error('Failed to fetch user stats');
  }

  return { totalUsers: count || 0 };
}

export async function getAllUsers() {
  await requireMaintainer();
  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching all users:', error);
    throw new Error('Failed to fetch users');
  }

  return data || [];
}

export async function dedicateSchool(formData: {
  schoolName: string;
  leadName: string;
  leadBhId?: string;
  city: string;
  district?: string;
}) {
  await requireMaintainer();
  const supabase = createServiceClient();

  // Generate base slug from school name
  let slug = formData.schoolName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Check for duplicate slug and append suffix if needed
  const { data: existing } = await supabase
    .from('chapters')
    .select('slug')
    .eq('slug', slug)
    .maybeSingle();

  if (existing) {
    let counter = 2;
    while (true) {
      const candidate = `${slug}-${counter}`;
      const { data: clash } = await supabase
        .from('chapters')
        .select('slug')
        .eq('slug', candidate)
        .maybeSingle();
      if (!clash) {
        slug = candidate;
        break;
      }
      counter++;
    }
  }

  // Resolve lead profile UUID if BH-ID provided
  let leadProfileId: string | null = null;
  if (formData.leadBhId) {
    const { data: leadProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('bh_id', formData.leadBhId)
      .maybeSingle();
    leadProfileId = leadProfile?.id ?? null;
  }

  const { data, error } = await supabase
    .from('chapters')
    .insert({
      slug,
      name: formData.schoolName,
      school: formData.schoolName,
      lead_name: formData.leadName,
      city: formData.city,
      district: formData.district || formData.city,
      province: 'Lumbini Province',
      status: 'active',
      established: new Date().getFullYear().toString(),
      member_count: 1,
      description: `${formData.schoolName} chapter, led by ${formData.leadName}.`,
      highlights: [],
      tags: ['school', formData.city.toLowerCase().replace(/\s+/g, ''), 'students'],
      social_links: {},
    })
    .select()
    .single();

  if (error) {
    logger.error('Error dedicating school:', error);
    throw new Error(error.message || 'Failed to dedicate school');
  }

  // Create chapter_members record if lead profile was resolved
  if (leadProfileId) {
    const { error: memberError } = await supabase
      .from('chapter_members')
      .upsert({
        chapter_id: data.id,
        profile_id: leadProfileId,
        org_role: 'admin',
      }, { onConflict: 'chapter_id,profile_id' });

    if (memberError) {
      logger.error('Error creating chapter member for lead:', memberError);
      // Non-fatal — chapter was created, lead just won't have dashboard access
    }
  }

  revalidatePath('/dashboard/maintainer/dedicate-school');
  revalidatePath('/chapters');
  return { success: true, chapter: data };
}

export async function banUser(userId: string) {
  await requireMaintainer();
  const supabase = createServiceClient();
  
  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: true })
    .eq('id', userId);

  if (error) {
    logger.error('Error banning user:', error);
    throw new Error('Failed to ban user');
  }

  revalidatePath('/dashboard/maintainer/users');
  return { success: true };
}
