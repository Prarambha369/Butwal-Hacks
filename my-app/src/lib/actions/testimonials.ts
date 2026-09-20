'use server';

import { createServiceClient } from '@/utils/supabase';
import { logger } from '@/lib/logger';
import { sanitizeString } from '@/lib/validation';
import { revalidatePath } from 'next/cache';
import { requireMaintainer } from '@/lib/actions/admin';

export interface ModeratedTestimonial {
  id: string;
  event_id: string | null;
  profile_id: string | null;
  rating: number | null;
  comment: string | null;
  status: string;
  is_featured: boolean;
  author_type: string;
  source: string | null;
  guest_name: string | null;
  guest_title: string | null;
  created_at: string;
  profile: { full_name: string | null; bh_id: string | null; avatar_url: string | null } | null;
}

function revalidateAll() {
  revalidatePath('/community');
  revalidatePath('/dashboard/maintainer/testimonials');
}

/** Full queue for maintainers (pending first, then newest). */
export async function getTestimonialQueue(): Promise<ModeratedTestimonial[]> {
  await requireMaintainer();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('event_reviews')
    .select('id, event_id, profile_id, rating, comment, status, is_featured, author_type, source, guest_name, guest_title, created_at, profile:profiles(full_name, bh_id, avatar_url)')
    .order('created_at', { ascending: false });
  if (error) {
    logger.error('Error fetching testimonial queue:', error);
    throw new Error('Failed to load testimonials');
  }
  const rows = (data ?? []) as unknown as ModeratedTestimonial[];
  return [...rows].sort((a, b) => {
    const rank = (s: string) => (s === 'pending' ? 0 : s === 'approved' ? 1 : 2);
    return rank(a.status) - rank(b.status);
  });
}

/** Public approved list for display (featured first, then newest). */
export async function getApprovedTestimonials(limit = 12): Promise<ModeratedTestimonial[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('event_reviews')
    .select('id, event_id, profile_id, rating, comment, status, is_featured, author_type, source, guest_name, guest_title, created_at, profile:profiles(full_name, bh_id, avatar_url)')
    .eq('status', 'approved')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    logger.error('Error fetching approved testimonials:', error);
    return [];
  }
  return (data ?? []) as unknown as ModeratedTestimonial[];
}

export async function setTestimonialStatus(id: string, status: 'approved' | 'rejected' | 'pending') {
  await requireMaintainer();
  const supabase = createServiceClient();
  const { error } = await supabase.from('event_reviews').update({ status }).eq('id', id);
  if (error) {
    logger.error('Error updating testimonial status:', error);
    throw new Error('Failed to update testimonial');
  }
  revalidateAll();
  return { success: true };
}

export async function toggleTestimonialFeatured(id: string, featured: boolean) {
  await requireMaintainer();
  const supabase = createServiceClient();
  const { error } = await supabase.from('event_reviews').update({ is_featured: featured }).eq('id', id);
  if (error) {
    logger.error('Error featuring testimonial:', error);
    throw new Error('Failed to update testimonial');
  }
  revalidateAll();
  return { success: true };
}

export async function deleteTestimonial(id: string) {
  await requireMaintainer();
  const supabase = createServiceClient();
  const { error } = await supabase.from('event_reviews').delete().eq('id', id);
  if (error) {
    logger.error('Error deleting testimonial:', error);
    throw new Error('Failed to delete testimonial');
  }
  revalidateAll();
  return { success: true };
}

export interface VipQuoteInput {
  name: string;
  title: string;
  quote: string;
  source?: string;
}

/**
 * Maintainer-authored VIP quote (e.g. words spoken by a principal at an
 * event). VIPs usually have no platform account — and fake profile rows
 * would inflate member counts — so attribution lives on the review itself
 * (guest_name/guest_title), clearly marked author_type='maintainer'.
 */
export async function addVipQuote(input: VipQuoteInput) {
  await requireMaintainer();
  const name = sanitizeString(input.name, 200).trim();
  const title = sanitizeString(input.title, 200).trim();
  const quote = sanitizeString(input.quote, 2000).trim();
  const source = sanitizeString(input.source ?? '', 300).trim();
  if (name.length < 2 || title.length < 2 || quote.length < 10) {
    throw new Error('Name, title, and a quote of at least 10 characters are required');
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from('event_reviews').insert({
    event_id: null,
    profile_id: null,
    rating: null,
    comment: quote,
    status: 'approved',
    is_featured: true,
    author_type: 'maintainer',
    source: source || null,
    guest_name: name,
    guest_title: title,
  });
  if (error) {
    logger.error('Error saving VIP quote:', error);
    throw new Error('Failed to save VIP quote');
  }
  revalidateAll();
  return { success: true };
}
