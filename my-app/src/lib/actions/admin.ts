'use server';

import { logger } from '@/lib/logger'
import { createServiceClient } from '@/utils/supabase/service';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth-guard';

export async function updateUserRole(userId: string, newRole: string) {
  await requireRole('maintainer');
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

export async function revokeTrustMarker(userId: string, markerId: string) {
  await requireRole('maintainer');
  const supabase = createServiceClient();
  
  const { error } = await supabase
    .from('trust_markers')
    .delete()
    .eq('id', markerId)
    .eq('profile_id', userId);

  if (error) {
    logger.error('Error revoking trust marker:', error);
    throw new Error('Failed to revoke trust marker');
  }

  revalidatePath('/dashboard/maintainer/users');
  return { success: true };
}

export async function getAdminUserStats() {
  await requireRole('maintainer');
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
  await requireRole('maintainer');
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

export async function banUser(userId: string) {
  await requireRole('maintainer');
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
