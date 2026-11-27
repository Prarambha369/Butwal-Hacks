/**
 * Public, maintainer-editable homepage copy.
 *
 * Plain server module, not a "use server" action file: a server action in a
 * marketing page's import graph blocks the static export (scripts/
 * build-static.mjs). Served by GET /api/site-content to the client hook in
 * components/site-content.tsx. Maintainer reads and writes stay in
 * lib/actions/site-content.ts.
 */
import "server-only";
import { createServiceClient } from '@/utils/supabase';
import { EDITABLE_KEYS, type LocalizedText } from '@/lib/site-content-keys';

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
