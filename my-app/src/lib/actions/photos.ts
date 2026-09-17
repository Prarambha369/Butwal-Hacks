'use server';

import { createServiceClient } from '@/utils/supabase';
import { logger } from '@/lib/logger';
import { resolveProfileId } from '@/lib/profile-resolver';
import { revalidatePath } from 'next/cache';
import { requireMaintainer } from '@/lib/actions/admin';

export interface GalleryPhotoRow {
  id: string;
  event_id: string;
  url: string;
  status: string;
  is_cover: boolean;
  created_at: string;
  uploader_name: string | null;
  event_title: string | null;
  event_slug: string | null;
}

function toRow(r: Record<string, unknown>): GalleryPhotoRow {
  const ev = r.events as { title?: string; slug?: string } | null;
  const prof = r.profile as { full_name?: string } | null;
  return {
    id: r.id as string,
    event_id: r.event_id as string,
    url: r.url as string,
    status: (r.status as string) ?? 'pending',
    is_cover: Boolean(r.is_cover),
    created_at: r.created_at as string,
    uploader_name: prof?.full_name ?? null,
    event_title: ev?.title ?? null,
    event_slug: ev?.slug ?? null,
  };
}

const PHOTO_SELECT = `
  id, event_id, url, status, is_cover, created_at,
  events ( title, slug ),
  profile:profiles!photos_uploader_id_fkey ( full_name )
`;

/** Caller must own the event or be a maintainer. Returns profile id. */
async function requireEventAccess(eventId: string, maintainerOnly = false): Promise<string> {
  const supabase = createServiceClient();
  if (!maintainerOnly) {
    try {
      await requireMaintainer();
      const profileId = await resolveProfileId();
      return profileId;
    } catch {
      // Not a maintainer — fall through to organizer check below.
    }
  } else {
    await requireMaintainer();
    return resolveProfileId();
  }

  const profileId = await resolveProfileId();
  const { data: event, error } = await supabase
    .from('events')
    .select('organizer_id')
    .eq('id', eventId)
    .single();
  if (error || !event || (event as { organizer_id: string }).organizer_id !== profileId) {
    throw new Error('Only the event organizer or a maintainer can moderate these photos');
  }
  return profileId;
}

/**
 * Member upload: any signed-in member. Rows land pending (invisible
 * until approved). No attendance gate by design — moderation catches abuse.
 */
export async function addEventPhotos(eventId: string, urls: string[]) {
  const clean = urls
    .map((u) => u.trim())
    .filter((u) => u.startsWith('https://'));
  if (clean.length === 0) {
    return { success: false, error: 'No valid photo URLs provided' };
  }
  if (clean.length > 20) {
    return { success: false, error: 'At most 20 photos per upload' };
  }
  try {
    const supabase = createServiceClient();
    const profileId = await resolveProfileId();

    const { error } = await supabase.from('photos').insert(
      clean.map((url) => ({
        event_id: eventId,
        uploader_id: profileId,
        url,
        status: 'pending',
      })),
    );
    if (error) throw error;
    revalidatePath('/gallery');
    return { success: true, count: clean.length };
  } catch (error) {
    logger.error('Error adding event photos:', error);
    return { success: false, error: 'Failed to save photos' };
  }
}

/** All photos for one event (any status) — organizer + maintainer view. */
export async function getEventPhotos(eventId: string): Promise<GalleryPhotoRow[]> {
  await requireEventAccess(eventId);
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('photos')
    .select(PHOTO_SELECT)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });
  if (error) {
    logger.error('Error fetching event photos:', error);
    throw new Error('Failed to load photos');
  }
  return ((data ?? []) as unknown as Record<string, unknown>[]).map(toRow);
}

/** Pending queue across all events — maintainer only. */
export async function getPendingPhotos(): Promise<GalleryPhotoRow[]> {
  await requireMaintainer();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('photos')
    .select(PHOTO_SELECT)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) {
    logger.error('Error fetching pending photos:', error);
    throw new Error('Failed to load photos');
  }
  return ((data ?? []) as unknown as Record<string, unknown>[]).map(toRow);
}

/** Approved covers for home — public, newest events first. */
export async function getCoverPhotos(limit = 6): Promise<GalleryPhotoRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('photos')
    .select(PHOTO_SELECT)
    .eq('status', 'approved')
    .eq('is_cover', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    logger.error('Error fetching cover photos:', error);
    return [];
  }
  return ((data ?? []) as unknown as Record<string, unknown>[]).map(toRow);
}

export async function setPhotoStatus(photoId: string, status: 'approved' | 'rejected' | 'pending') {
  const supabase = createServiceClient();
  const { data: photo, error: fetchError } = await supabase
    .from('photos')
    .select('event_id')
    .eq('id', photoId)
    .single();
  if (fetchError || !photo) throw new Error('Photo not found');
  await requireEventAccess((photo as { event_id: string }).event_id);

  const { error } = await supabase.from('photos').update({ status }).eq('id', photoId);
  if (error) {
    logger.error('Error updating photo status:', error);
    throw new Error('Failed to update photo');
  }
  revalidatePath('/gallery');
  revalidatePath('/');
  return { success: true };
}

/** Maintainer-only: pick this photo as its event's home cover. */
export async function setPhotoCover(photoId: string) {
  const supabase = createServiceClient();
  const { data: photo, error: fetchError } = await supabase
    .from('photos')
    .select('event_id')
    .eq('id', photoId)
    .single();
  if (fetchError || !photo) throw new Error('Photo not found');
  await requireEventAccess((photo as { event_id: string }).event_id, true);

  const eventId = (photo as { event_id: string }).event_id;
  const { error: clearError } = await supabase
    .from('photos')
    .update({ is_cover: false })
    .eq('event_id', eventId);
  if (clearError) {
    logger.error('Error clearing photo cover:', clearError);
    throw new Error('Failed to set cover photo');
  }
  const { error } = await supabase
    .from('photos')
    .update({ is_cover: true, status: 'approved' })
    .eq('id', photoId);
  if (error) {
    logger.error('Error setting photo cover:', error);
    throw new Error('Failed to set cover photo');
  }
  revalidatePath('/gallery');
  revalidatePath('/');
  return { success: true };
}

export async function deletePhoto(photoId: string) {
  const supabase = createServiceClient();
  const { data: photo, error: fetchError } = await supabase
    .from('photos')
    .select('event_id')
    .eq('id', photoId)
    .single();
  if (fetchError || !photo) throw new Error('Photo not found');
  await requireEventAccess((photo as { event_id: string }).event_id);

  const { error } = await supabase.from('photos').delete().eq('id', photoId);
  if (error) {
    logger.error('Error deleting photo:', error);
    throw new Error('Failed to delete photo');
  }
  revalidatePath('/gallery');
  revalidatePath('/');
  return { success: true };
}
