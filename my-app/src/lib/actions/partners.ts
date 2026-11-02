'use server';

import { createServiceClient } from '@/utils/supabase';
import { logger } from '@/lib/logger';
import { requireMaintainer } from '@/lib/actions/admin';
import { revalidatePath } from 'next/cache';

export interface Partner {
  id: string;
  name: string;
  /** Legacy https URL, kept for partners added before the Cloudinary upload flow. Null for Cloudinary-backed logos. */
  logo_url: string | null;
  /** Cloudinary public id for a partner logo uploaded through the maintainer wall. When set, `logo_url` must be derived from this on read (light/dark delivery), not stored as a static URL. */
  cloudinary_public_id: string | null;
  href: string | null;
  sort_order: number;
  is_active: boolean;
}

/** Public wall: active partners only, maintainer-ordered. */
export async function getActivePartners(): Promise<Partner[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('partners')
    .select('id, name, logo_url, cloudinary_public_id, href, sort_order, is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .abortSignal(AbortSignal.timeout(5000));
  if (error) {
    // PGRST205 = table missing from schema cache (preview/dev DB behind
    // on migrations). Benign and self-healing: return empty, no log spam.
    if ((error as { code?: string }).code === 'PGRST205') return [];
    logger.error('Error fetching partners:', error);
    return [];
  }
  return (data ?? []) as Partner[];
}

/** Full list for the maintainer editor. */
export async function getAllPartners(): Promise<Partner[]> {
  await requireMaintainer();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('partners')
    .select('id, name, logo_url, cloudinary_public_id, href, sort_order, is_active')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .abortSignal(AbortSignal.timeout(5000));
  if (error) {
    logger.error('Error fetching all partners:', error);
    throw new Error('Failed to load partners');
  }
  return (data ?? []) as Partner[];
}

function cleanUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed.startsWith('https://')) return null;
  return trimmed;
}

export async function savePartner(input: {
  id?: string;
  name: string;
  logo_url?: string | null;
  cloudinary_public_id?: string | null;
  href?: string | null;
  sort_order?: number;
  is_active?: boolean;
}) {
  await requireMaintainer();
  const name = input.name.trim().slice(0, 120);
  if (!name) throw new Error('Partner name is required');

  // A partner logo is either a legacy external https URL or a Cloudinary
  // asset. When a Cloudinary public id is supplied (uploaded through the
  // maintainer wall), it is the source of truth and the legacy URL is
  // cleared so the homepage always derives the deliverable from the
  // public id for both light and dark mode.
  let cloudinaryPublicId: string | null = null;
  let logoUrl: string | null = null;

  if (typeof input.cloudinary_public_id === 'string' && input.cloudinary_public_id.trim().length > 0) {
    cloudinaryPublicId = input.cloudinary_public_id.trim().slice(0, 255);
    logoUrl = null;
  } else if (typeof input.logo_url === 'string' && input.logo_url.trim().length > 0) {
    logoUrl = cleanUrl(input.logo_url);
    cloudinaryPublicId = null;
  }

  const row = {
    name,
    logo_url: logoUrl,
    cloudinary_public_id: cloudinaryPublicId,
    href: cleanUrl(input.href),
    sort_order: Number.isFinite(input.sort_order) ? Math.trunc(input.sort_order as number) : 0,
    is_active: input.is_active ?? true,
  };
  const supabase = createServiceClient();
  const { error } = input.id
    ? await supabase.from('partners').update(row).eq('id', input.id)
    : await supabase.from('partners').insert(row);
  if (error) {
    logger.error('Error saving partner:', error);
    throw new Error('Failed to save partner');
  }
  revalidatePath('/');
  return { success: true };
}

export async function deletePartner(id: string) {
  await requireMaintainer();
  const supabase = createServiceClient();
  const { error } = await supabase.from('partners').delete().eq('id', id);
  if (error) {
    logger.error('Error deleting partner:', error);
    throw new Error('Failed to delete partner');
  }
  revalidatePath('/');
  return { success: true };
}
