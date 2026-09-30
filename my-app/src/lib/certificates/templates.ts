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

  return normaliseTemplate({
    id: chosen.id,
    eventId: chosen.event_id,
    name: chosen.name,
    backgroundUrl: chosen.background_url,
    pageWidth: chosen.page_width,
    pageHeight: chosen.page_height,
    fields: chosen.fields,
    isDefault: chosen.is_default,
  });
}
