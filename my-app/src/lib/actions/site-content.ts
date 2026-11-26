'use server';

import { createServiceClient } from '@/utils/supabase';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import { requireMaintainer } from '@/lib/actions/admin';
import { EDITABLE_KEYS, type LocalizedText } from '@/lib/site-content-keys';

export type { LocalizedText };

/**
 * Every public, maintainer-editable value in one round trip (null = never
 * edited, so the caller keeps its i18n fallback). Fails fast on DB stalls.
 *
 * Public by design: these are the homepage strings anyone can read on the
 * site, so no session is required. The read is limited to the registered
 * EDITABLE_KEYS, so the service-role client cannot be used to read any other
 * row of the table. One call per page load replaces one server action per key:
 * each action is a POST to the page path, and the homepage was sending four.
 */
export async function getPublicSiteContent(): Promise<Record<string, LocalizedText | null>> {
  const keys = EDITABLE_KEYS.map((k) => k.key);
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('site_content')
    .select('key, value')
    .in('key', keys)
    .abortSignal(AbortSignal.timeout(5000));
  if (error) return {};
  const map: Record<string, LocalizedText | null> = {};
  for (const row of data ?? []) {
    const v = row.value as Partial<LocalizedText> | null;
    map[row.key] = v && typeof v.en === 'string' && typeof v.ne === 'string'
      ? { en: v.en, ne: v.ne }
      : null;
  }
  return map;
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
