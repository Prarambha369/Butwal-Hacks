import { createServiceClient } from "@/utils/supabase";

/**
 * generateStaticParams for data-backed detail pages.
 *
 * On Vercel these pages render on demand and are cached (ISR), so their
 * generateStaticParams returns [] and nothing is rendered at build time.
 *
 * The static marketing export (BUILD_TARGET=static, scripts/build-static.mjs)
 * has no server, so every page must be rendered at build time: there it lists
 * every row, using the same filters the page uses to decide what is public.
 * Static export also refuses a dynamic route with zero params, so an empty
 * table yields one placeholder slug, which the page turns into its 404.
 */
export const IS_STATIC_EXPORT = process.env.BUILD_TARGET === "static";
export const STATIC_PLACEHOLDER = "__none__";

async function exportOnly<K extends string>(
  key: K,
  load: () => Promise<Array<string | null>>,
): Promise<Array<Record<K, string>>> {
  if (!IS_STATIC_EXPORT) return [];
  const values = (await load()).filter((v): v is string => Boolean(v));
  const unique = [...new Set(values.length ? values : [STATIC_PLACEHOLDER])];
  return unique.map((value) => ({ [key]: value }) as Record<K, string>);
}

/** Published events, matching app/(main)/events/[slug]. */
export function eventSlugParams() {
  return exportOnly("slug", async () => {
    const { data, error } = await createServiceClient().from("events").select("slug").eq("is_published", true);
    if (error) throw new Error(`static export: events read failed: ${error.message}`);
    return (data ?? []).map((r) => r.slug as string | null);
  });
}

/** Active chapters, matching app/(main)/chapters/[slug]. */
export function chapterSlugParams() {
  return exportOnly("slug", async () => {
    const { data, error } = await createServiceClient().from("chapters").select("slug").eq("is_active", true);
    if (error) throw new Error(`static export: chapters read failed: ${error.message}`);
    return (data ?? []).map((r) => r.slug as string | null);
  });
}

/** Approved photos, matching app/(main)/gallery/[id]. */
export function galleryPhotoParams() {
  return exportOnly("id", async () => {
    const { data, error } = await createServiceClient().from("photos").select("id").eq("status", "approved");
    if (error) throw new Error(`static export: photos read failed: ${error.message}`);
    return (data ?? []).map((r) => (r.id == null ? null : String(r.id)));
  });
}
