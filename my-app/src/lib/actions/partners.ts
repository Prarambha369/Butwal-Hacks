'use server';

import { createServiceClient } from '@/utils/supabase';
import { logger } from '@/lib/logger';
import { requireMaintainer } from '@/lib/actions/admin';
import { revalidatePath } from 'next/cache';

export interface Partner {
  id: string;
  name: string;
  logo_url: string | null;
  href: string | null;
  sort_order: number;
  is_active: boolean;
}

/** Public wall: active partners only, maintainer-ordered. */
export async function getActivePartners(): Promise<Partner[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('partners')
    .select('id, name, logo_url, href, sort_order, is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
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
    .select('id, name, logo_url, href, sort_order, is_active')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
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
  href?: string | null;
  sort_order?: number;
  is_active?: boolean;
}) {
  await requireMaintainer();
  const name = input.name.trim().slice(0, 120);
  if (!name) throw new Error('Partner name is required');
  const row = {
    name,
    logo_url: cleanUrl(input.logo_url),
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
