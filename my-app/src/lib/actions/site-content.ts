'use server';

import { createServiceClient } from '@/utils/supabase';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import { requireMaintainer } from '@/lib/actions/admin';
import { EDITABLE_KEYS, type LocalizedText } from '@/lib/site-content-keys';

export type { LocalizedText };

/** Raw DB value (or null when never edited). Fails fast on DB stalls. */
export async function getSiteContentValue(key: string): Promise<LocalizedText | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('site_content')
    .select('value')
    .eq('key', key)
    .abortSignal(AbortSignal.timeout(5000))
    .single();
  if (error || !data) return null;
  const v = data.value as Partial<LocalizedText> | null;
  if (!v || typeof v.en !== 'string' || typeof v.ne !== 'string') return null;
  return { en: v.en, ne: v.ne };
}

/** All editable values in one roundtrip (admin editor). */
export async function getSiteContentMap(): Promise<Record<string, LocalizedText | null>> {
  await requireMaintainer();
  const supabase = createServiceClient();
  const { data, error } = await supabase.from('site_content').select('key, value');
  if (error) {
    logger.error('Error loading site content:', error);
    throw new Error('Failed to load site content');
  }
  const map: Record<string, LocalizedText | null> = {};
  for (const row of data ?? []) {
    const v = row.value as Partial<LocalizedText> | null;
    map[row.key] = v && typeof v.en === 'string' && typeof v.ne === 'string'
      ? { en: v.en, ne: v.ne }
      : null;
  }
  return map;
}

export async function setSiteContent(key: string, value: LocalizedText) {
  await requireMaintainer();
  if (!EDITABLE_KEYS.some((k) => k.key === key)) {
    throw new Error(`Unknown content key: ${key}`);
  }
  if (!value.en.trim() || !value.ne.trim()) {
    throw new Error('Both English and Nepali text are required');
  }
  const supabase = createServiceClient();
  const { error } = await supabase.from('site_content').upsert(
    { key, value: { en: value.en.trim(), ne: value.ne.trim() }, updated_at: new Date().toISOString() },
    { onConflict: 'key' },
  );
  if (error) {
    logger.error('Error saving site content:', error);
    throw new Error('Failed to save site content');
  }
  revalidatePath('/');
  return { success: true };
}
