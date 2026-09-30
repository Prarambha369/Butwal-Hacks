import { createServiceClient } from "@/utils/supabase";
import { normaliseTemplate, type CertificateTemplate } from "@/lib/certificates/template";

/**
 * Reading a certificate template.
 *
 * This lives outside `lib/actions/certificates.ts` deliberately. That file is
 * `"use server"`, so *every* export from it is a remotely callable endpoint --
 * including anything that was only ever meant to be a helper. Keeping reads
 * here means they stay reads, and there is no accidental endpoint to
 * authorize.
 *
 * Templates are not secret: the artwork is what ends up printed on a public
 * PDF, and a certificate's public verification page renders it. The
 * recipient's identity is never part of a template, only of the render values.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Map a `certificate_templates` row to the shape `normaliseTemplate` expects.
 *
 * The row is snake_case; the template model is camelCase. Passing the row
 * straight through loses everything but `id`, `name` and `fields` -- and since
 * the editor saves whatever it was given, opening a saved template and clicking
 * Save silently nulled its background, reset the page size to 1056x816, and
 * cleared `is_default`. Verified against a real row before fixing.
 *
 * Shared by the resolver and the editor page so the two cannot drift again.
 */
export function templateFromRow(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id,
    name: row.name,
    fields: row.fields,
    eventId: row.event_id ?? null,
    backgroundUrl: row.background_url ?? null,
    pageWidth: row.page_width,
    pageHeight: row.page_height,
    isDefault: row.is_default === true,
  };
}

/**
 * The template an event should render with: that event's own default, then
 * the organisation-wide default, then any template for the event, then null.
 *
 * Returns null rather than throwing so the caller can fall back to a plain
 * layout -- a certificate must stay printable even with no artwork designed.
 */
export async function resolveTemplateForEvent(
  eventId: string,
): Promise<CertificateTemplate | null> {
  // Interpolation into a PostgREST `.or()` filter is only safe on a validated
  // UUID; an unvalidated id is a filter-injection string.
  if (!UUID.test(eventId)) return null;

  const supabase = createServiceClient();

  // Two queries instead of one `.or()`: no filter grammar to inject into.
  const [scoped, global] = await Promise.all([
    supabase
      .from("certificate_templates")
      .select("*")
      .eq("event_id", eventId)
      .order("is_default", { ascending: false }),
    supabase
      .from("certificate_templates")
      .select("*")
      .is("event_id", null)
      .order("is_default", { ascending: false }),
  ]);

  const asRows = (r: { data?: unknown } | null) =>
    ((r?.data ?? []) as Array<Record<string, unknown>>);

  const eventRows = asRows(scoped);
  const globalRows = asRows(global);

  const chosen =
    eventRows.find((r) => r.is_default === true) ??
    globalRows.find((r) => r.is_default === true) ??
    eventRows[0] ??
    globalRows[0] ??
    null;

  if (!chosen) return null;

  return normaliseTemplate(templateFromRow(chosen));
}
