import { createServiceClient } from "@/utils/supabase";
import { resolveVerifiable, isCertificateActive } from "@/lib/verify/resolve";
import { resolveTemplateForEvent } from "@/lib/certificates/templates";
import { renderCertificate } from "@/lib/certificates/render";
import { normaliseTemplate } from "@/lib/certificates/template";
import { SITE_URL } from "@/lib/constants";
import { logger } from "@/lib/logger";

/**
 * `GET /api/certificates/[id]/pdf` — the printable certificate.
 *
 * This is what the template system exists to produce, and it is why the
 * delivery email links here rather than attaching a file: the artwork is
 * rendered fresh from the current template, so a design fix reaches everyone
 * who has not printed yet, and a revoked certificate cannot be printed at all.
 *
 * No authentication. A certificate is a credential whose whole purpose is to
 * be shown to a third party, and the id is an unguessable UUID. The PDF is
 * also `no-store`, so it is never served from a CDN cache -- a cached copy
 * would outlive a revocation.
 */

export const dynamic = "force-dynamic";

function errorResponse(status: number, message: string, extra?: Record<string, string>) {
  return new Response(JSON.stringify({ error: message, ...extra }), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return errorResponse(400, "Malformed certificate id");
  }

  const supabase = createServiceClient();
  const verifiable = await resolveVerifiable(supabase, id);

  if (!verifiable) return errorResponse(404, "Certificate not found");

  // A marker id can land here if someone bookmarks this path. Redirecting to
  // the verification page is more useful than an error.
  if (verifiable.kind === "marker") {
    return new Response(null, {
      status: 307,
      headers: { Location: `/verify/${id}` },
    });
  }

  const { certificate } = verifiable;

  if (!isCertificateActive(certificate.status)) {
    return errorResponse(410, "This certificate has been revoked", {
      status: certificate.status ?? "revoked",
    });
  }

  const eventId = (certificate.events as { id?: string } | null)?.id;
  if (!eventId) return errorResponse(422, "This certificate is not linked to an event");

  const values: Record<string, string> = {
    name: certificate.profile?.full_name ?? "",
    email: certificate.profile?.email ?? "",
    bh_id: certificate.profile?.bh_id ?? "",
    title: "Certificate of Participation",
    // Pinned to Nepal time, not the server's zone. Without this the printed day
    // depends on where the render ran: Vercel is UTC, a laptop in Kathmandu is
    // +05:45, so a certificate issued at 18:30 UTC printed "October 1" in
    // production and "October 2" in development. issue_date is TIMESTAMPTZ, so
    // the discrepancy was real and silent. A date-only fixture never showed it
    // because +05:45 does not cross midnight for a midnight-UTC timestamp.
    date: new Date(certificate.issue_date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Katmandu",
    }),
    event: (certificate.events as { title?: string } | null)?.title ?? "",
  };

  // No template is a supported state, not an error: fall back to a plain
  // layout so a certificate is never undownloadable because nobody has
  // designed one yet.
  const template = await resolveTemplateForEvent(eventId);
  const tpl = template ?? normaliseTemplate({ name: "Built-in" });

  try {
    const { bytes, warnings } = await renderCertificate({
      template: tpl,
      values,
      verifyUrl: `${SITE_URL}/verify/${id}`,
    });

    if (warnings.length > 0) {
      // Surfaced rather than swallowed: a silently degraded certificate looks
      // identical to a correct one until a recipient notices.
      logger.warn("certificate.pdf.warnings", { id, warnings });
    }

    // Counting goes through a function so the increment is atomic; a plain
    // upsert here would reset the counter to 1 on every print.
    const { error: countError } = await supabase.rpc("record_certificate_download", {
      p_certificate_id: id,
      p_event_id: eventId,
    });
    // Deliberately not fatal. A missing download count is an audit-trail
    // problem, and failing the request would hand the recipient a broken
    // certificate for it. But it was previously discarded entirely, so the
    // counter could be permanently frozen at 0 with nothing logged.
    if (countError) {
      logger.warn("certificate.pdf.download_count_failed", { id, error: countError.message });
    }

    const safeName = (values.name || "certificate")
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60);

    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="butwal-hacks-${safeName || "certificate"}.pdf"`,
        "Cache-Control": "no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    logger.error("certificate.pdf.render_failed", {
      id,
      error: err instanceof Error ? err.message : String(err),
    });
    return errorResponse(500, "Could not render this certificate");
  }
}
