'use server';

import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { logger } from '@/lib/logger'
import { createServiceClient } from '@/utils/supabase';
import { revalidatePath } from 'next/cache';
import { bustCache } from '@/lib/cache';

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

const ALLOWED_ROLES = ["hacker", "organizer", "maintainer", "sponsor", "lead"] as const;

export async function updateUserRole(userId: string, newRole: string) {
  await requireMaintainer();

  // Validate role against allowed list
  if (!ALLOWED_ROLES.includes(newRole as typeof ALLOWED_ROLES[number])) {
    throw new Error(`Invalid role: ${newRole}. Must be one of: ${ALLOWED_ROLES.join(", ")}`);
  }

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
 * Toggle a user's ban status. If banned, unbans them.
 */
export async function toggleBanUser(userId: string, currentlyBanned: boolean) {
  await requireMaintainer();
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: !currentlyBanned })
    .eq('id', userId);

  if (error) {
    logger.error('Error toggling user ban:', error);
    throw new Error('Failed to update user ban status');
  }

  revalidatePath('/dashboard/maintainer/users');
  return { success: true };
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

  // Bust Redis cache for the affected profile
  await bustMarkerProfileCache(markerId);

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

  // Bust Redis cache for the affected profile
  await bustMarkerProfileCache(markerId);

  revalidatePath('/dashboard/maintainer/trust-override');
  revalidatePath('/dashboard/maintainer/users');
  return { success: true };
}

/**
 * Look up the profile_id from a trust marker and bust its Redis cache.
 */
async function bustMarkerProfileCache(markerId: string) {
  try {
    const supabase = createServiceClient();
    const { data: marker } = await supabase
      .from('trust_markers')
      .select('profile_id')
      .eq('id', markerId)
      .single();
    if (marker?.profile_id) {
      const { data: p } = await supabase.from('profiles').select('bh_id').eq('id', marker.profile_id).single();
      if (p?.bh_id) await bustCache(`profile:bh_id:${p.bh_id}`);
    }
  } catch {
    // Graceful degradation
  }
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

/**
 * Get pending role requests (Maintainer only).
 */
export async function getPendingRoleRequests() {
  await requireMaintainer();
  const supabase = createServiceClient();

  const { data: requests } = await supabase
    .from("role_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return requests ?? [];
}

/**
 * Approve a pending role request — updates the user's role and marks the request as approved.
 */
export async function approveRoleRequest(requestId: string) {
  await requireMaintainer();
  const supabase = createServiceClient();

  // Get the request
  const { data: req, error: reqError } = await supabase
    .from("role_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (reqError || !req) throw new Error("Role request not found.");
  if (req.status !== "pending") throw new Error("Request has already been processed.");

  // Update the user's role
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role: req.requested_role })
    .eq("auth0_user_id", req.auth0_user_id);

  if (updateError) {
    throw new Error("Failed to approve request.");
  }

  // Update request status
  const session = await auth0.getSession();
  const { error: statusError } = await supabase
    .from("role_requests")
    .update({
      status: "approved",
      reviewed_by: session?.user?.sub,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (statusError) throw new Error("Failed to update request status.");

  revalidatePath("/dashboard/maintainer/users");
  return { success: true, user: { auth0_user_id: req.auth0_user_id, role: req.requested_role } };
}

/**
 * Reject a pending role request.
 */
export async function rejectRoleRequest(requestId: string) {
  await requireMaintainer();
  const supabase = createServiceClient();

  const session = await auth0.getSession();
  const { error } = await supabase
    .from("role_requests")
    .update({
      status: "rejected",
      reviewed_by: session?.user?.sub,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) throw new Error("Failed to reject request.");

  revalidatePath("/dashboard/maintainer/users");
  return { success: true };
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

