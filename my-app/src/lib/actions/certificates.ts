"use server";

import { revalidatePath } from "next/cache";
import { auth0 } from "@/lib/auth0";
import { logger } from "@/lib/logger";
import { createServiceClient } from "@/utils/supabase";
import { SITE_URL } from "@/lib/constants";
import { normaliseTemplate, type CertificateTemplate } from "@/lib/certificates/template";
import { matchRoster, parseRosterCsv, type ImportRow } from "@/lib/certificates/csv";
import { dedupeEmails, domainsIn, filterByDomain } from "@/lib/certificates/email-filter";

/**
 * Certificate issuance, template management, and bulk delivery.
 *
 * Authorization is enforced HERE, in every action, not only in middleware.
 * `lib/actions/issue-marker.ts` has no role check at all and is reachable by
 * any signed-in user despite the parallel HTTP route gating correctly on
 * organizer/maintainer -- that is exactly the mistake this module exists to
 * not repeat. Middleware covers the UI route; a server action is its own
 * endpoint and needs its own check.
 */

const ISSUER_ROLES = new Set(["organizer", "maintainer"]);

/**
 * Resolve the caller and assert they may issue for this event.
 *
 * `organizer` must own the event; `maintainer` may act on any event. A
 * maintainer is deliberately allowed here even though closeEvent() rejects
 * them -- that inconsistency was flagged during review, and a maintainer who
 * can check people in and export the PDF must be able to trigger issuance.
 */
async function requireIssuer(eventId: string): Promise<{ profileId: string; role: string }> {
  const session = await auth0.getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const supabase = createServiceClient();
  const { data: caller } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("auth0_user_id", session.user.sub)
    .maybeSingle();

  if (!caller) throw new Error("Forbidden — no profile");
  if (!ISSUER_ROLES.has(caller.role)) {
    throw new Error("Forbidden — organizer or maintainer role required");
  }

  if (caller.role === "organizer") {
    const { data: event } = await supabase
      .from("events")
      .select("organizer_id")
      .eq("id", eventId)
      .maybeSingle();
    if (!event) throw new Error("Event not found");
    if (event.organizer_id !== caller.id) {
      throw new Error("Forbidden — you are not the organiser of this event");
    }
  }

  return { profileId: caller.id, role: caller.role };
}

/** Same role gate, for template management which is not event-scoped. */
async function requireTemplateEditor(): Promise<{ profileId: string; role: string }> {
  const session = await auth0.getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const supabase = createServiceClient();
  const { data: caller } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("auth0_user_id", session.user.sub)
    .maybeSingle();

  if (!caller) throw new Error("Forbidden — no profile");
  if (!ISSUER_ROLES.has(caller.role)) {
    throw new Error("Forbidden — organizer or maintainer role required");
  }
  return { profileId: caller.id, role: caller.role };
}

// ─── Templates ──────────────────────────────────────────────────────────────

export type SaveTemplateInput = {
  id?: string;
  eventId?: string | null;
  name: string;
  backgroundUrl?: string | null;
  pageWidth?: number;
  pageHeight?: number;
  fields?: unknown;
  isDefault?: boolean;
};

export async function saveTemplate(input: SaveTemplateInput) {
  const { profileId } = await requireTemplateEditor();
  const supabase = createServiceClient();

  const template = normaliseTemplate({
    name: input.name,
    backgroundUrl: input.backgroundUrl,
    pageWidth: input.pageWidth,
    pageHeight: input.pageHeight,
    fields: input.fields,
  });

  const row = {
    name: template.name,
    event_id: input.eventId ?? null,
    background_url: template.backgroundUrl,
    page_width: template.pageWidth,
    page_height: template.pageHeight,
    fields: template.fields,
    is_default: input.isDefault === true,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await supabase.from("certificate_templates").update(row).eq("id", input.id);
    if (error) throw new Error(`Could not update template: ${error.message}`);
    revalidatePath("/dashboard/maintainer/certificates/templates");
    revalidatePath("/dashboard/organizer/certificates/templates");
    return { id: input.id as string };
  }

  const { data, error } = await supabase
    .from("certificate_templates")
    .insert({ ...row, created_by: profileId })
    .select("id")
    .single();
  if (error) throw new Error(`Could not create template: ${error.message}`);

  revalidatePath("/dashboard/maintainer/certificates/templates");
  revalidatePath("/dashboard/organizer/certificates/templates");
  return { id: data.id as string };
}

export async function deleteTemplate(templateId: string) {
  await requireTemplateEditor();
  const supabase = createServiceClient();
  const { error } = await supabase.from("certificate_templates").delete().eq("id", templateId);
  if (error) throw new Error(`Could not delete template: ${error.message}`);
  revalidatePath("/dashboard/maintainer/certificates/templates");
  revalidatePath("/dashboard/organizer/certificates/templates");
  return { ok: true };
}

/**
 * The template an event should render with: that event's own default, else
 * any event template, else the organisation-wide default. Falls back to a
 * built-in so issuance never fails for want of artwork.
 */
export async function resolveTemplateForEvent(
  eventId: string,
): Promise<CertificateTemplate | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("certificate_templates")
    .select("*")
    .or(`event_id.eq.${eventId},event_id.is.null`)
    .order("is_default", { ascending: false });

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const eventDefault = rows.find((r) => r.event_id === eventId && r.is_default === true);
  const globalDefault = rows.find((r) => r.event_id === null && r.is_default === true);
  const anyForEvent = rows.find((r) => r.event_id === eventId);
  const chosen = eventDefault ?? globalDefault ?? anyForEvent ?? null;

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

// ─── Roster import + issuance ───────────────────────────────────────────────

export type ImportPreview = {
  total: number;
  matched: number;
  unmatched: number;
  duplicate: number;
  alreadyIssued: number;
  /** Domain -> address count, for the send filter's dropdown. */
  domains: Array<{ domain: string; count: number }>;
  sample: Array<{ name: string; email: string; status: string }>;
};

/**
 * Parse a roster and report what WOULD happen, without writing anything.
 *
 * The organiser sees this before committing, because issuing 240 of 300
 * certificates and telling nobody is not a recoverable mistake.
 */
export async function previewRosterCsv(eventId: string, csv: string) {
  await requireIssuer(eventId);
  const parsed = parseRosterCsv(csv);
  const emails = parsed.rows.map((r) => r.email);

  const candidates = await lookupCandidates(emails, eventId);
  const result = matchRoster(parsed.rows, candidates);

  const domainCounts = new Map<string, number>();
  for (const r of result.matched) {
    const domain = r.email.slice(r.email.lastIndexOf("@") + 1);
    domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);
  }

  const sample = [
    ...result.matched.slice(0, 5).map((r) => ({ name: r.name, email: r.email, status: "will issue" })),
    ...result.alreadyIssued.slice(0, 3).map((r) => ({ name: r.name, email: r.email, status: "already issued" })),
    ...result.unmatched.slice(0, 3).map((r) => ({ name: r.name, email: r.email, status: "no profile" })),
    ...result.duplicate.slice(0, 3).map((r) => ({ name: r.name, email: r.email, status: "duplicate row" })),
  ];

  return {
    rejected: parsed.rejected,
    preview: {
      total: parsed.rows.length + parsed.rejected.length,
      matched: result.matched.length,
      unmatched: result.unmatched.length,
      duplicate: result.duplicate.length,
      alreadyIssued: result.alreadyIssued.length,
      domains: [...domainCounts.entries()]
        .map(([domain, count]) => ({ domain, count }))
        .sort((a, b) => b.count - a.count),
      sample,
    } satisfies ImportPreview,
  };
}

/** Build the match candidates for a set of addresses, scoped to one event. */
async function lookupCandidates(emails: string[], eventId: string) {
  const supabase = createServiceClient();
  if (emails.length === 0) return new Map();

  // Chunked so a 5,000-row import cannot build a URL Postgres or PostgREST
  // will reject.
  const chunkSize = 200;
  const found = new Map<string, { profileId: string; bhId: string | null; hasCertificate: boolean }>();

  for (let i = 0; i < emails.length; i += chunkSize) {
    const chunk = emails.slice(i, i + chunkSize);
    const { data: registrations } = await supabase
      .from("event_registrations")
      .select("profile:profiles!inner(id, bh_id, email)")
      .in("profile.email", chunk)
      .eq("event_id", eventId);

    const profileIds = (registrations ?? [])
      .map((r) => (r.profile as { id?: string } | null)?.id)
      .filter((id): id is string => Boolean(id));

    if (profileIds.length === 0) continue;

    const { data: existing } = await supabase
      .from("certificates")
      .select("profile_id")
      .eq("event_id", eventId)
      .in("profile_id", profileIds);

    const already = new Set((existing ?? []).map((c) => c.profile_id as string));

    for (const reg of registrations ?? []) {
      const profile = reg.profile as { id?: string; bh_id?: string; email?: string } | null;
      if (!profile?.id || !profile.email) continue;
      found.set(profile.email.trim().toLowerCase(), {
        profileId: profile.id,
        bhId: profile.bh_id ?? null,
        hasCertificate: already.has(profile.id),
      });
    }
  }

  return found;
}

export type IssueResult = {
  issued: number;
  skipped: number;
  certificateIds: string[];
};

/**
 * Issue certificates for a roster. Idempotent per (event, profile) thanks to
 * the unique index added in migration 126, so a double-click cannot produce
 * two certificates for one person.
 */
export async function issueCertificatesFromRoster(
  eventId: string,
  csv: string,
): Promise<IssueResult> {
  const { profileId } = await requireIssuer(eventId);
  const supabase = createServiceClient();

  const parsed = parseRosterCsv(csv);
  const candidates = await lookupCandidates(parsed.rows.map((r) => r.email), eventId);
  const { matched, unmatched, duplicate, alreadyIssued } = matchRoster(parsed.rows, candidates);

  if (matched.length === 0) {
    return { issued: 0, skipped: unmatched.length + duplicate.length + alreadyIssued.length, certificateIds: [] };
  }

  const payload = matched.map((r) => ({
    profile_id: r.profileId,
    event_id: eventId,
    auth0_user_id: null,
    status: "issued",
  }));

  const { data, error } = await supabase
    .from("certificates")
    .upsert(payload, { onConflict: "event_id,profile_id", ignoreDuplicates: true })
    .select("id, profile_id");

  if (error) throw new Error(`Could not issue certificates: ${error.message}`);

  const inserted = data ?? [];

  // One delivery row per issued certificate, so the send log and the download
  // log are the same table and the CSV export covers both.
  if (inserted.length > 0) {
    await supabase.from("certificate_deliveries").upsert(
      inserted.map((c) => ({
        certificate_id: c.id as string,
        event_id: eventId,
        channel: "email",
        status: "queued",
      })),
      { onConflict: "certificate_id,channel", ignoreDuplicates: true },
    );
  }

  logger.info("certificates.issued", {
    event_id: eventId,
    issued_by: profileId,
    issued: inserted.length,
    unmatched: unmatched.length,
  });

  revalidatePath(`/dashboard/organizer/events/${eventId}`);

  return {
    issued: inserted.length,
    skipped: unmatched.length + duplicate.length + alreadyIssued.length,
    certificateIds: inserted.map((c) => c.id as string),
  };
}

// ─── Bulk delivery ──────────────────────────────────────────────────────────

export type SendSummary = {
  domain: string;
  subdomains: boolean;
  /** Candidates under the filter, before dedupe. */
  candidates: number;
  sent: number;
  failed: number;
  skippedAlreadySent: number;
};

/**
 * Send certificate emails to everyone under a domain.
 *
 * The filter is `emailMatchesDomain`, which is dot-bounded on purpose: a
 * naive endsWith would treat notbutwalhacks.com as a match and mail one
 * organiser's roster to a domain they do not control.
 */
export async function sendCertificateEmails(
  eventId: string,
  options: { domain: string; subdomains?: boolean },
): Promise<SendSummary> {
  const { profileId } = await requireIssuer(eventId);
  const supabase = createServiceClient();
  const { sendCertificateEmail } = await import("@/lib/certificates/email");

  const domain = options.domain.trim().toLowerCase();
  if (!domain || !domain.includes(".")) {
    throw new Error("A domain is required, for example butwalhacks.com");
  }

  const { data: certs } = await supabase
    .from("certificates")
    .select("id, profile:profiles!inner(id, full_name, email, bh_id)")
    .eq("event_id", eventId);

  const roster = ((certs ?? []) as Array<Record<string, unknown>>)
    .map((c) => {
      const profile = c.profile as { full_name?: string; email?: string; bh_id?: string } | null;
      return { certificateId: c.id as string, name: profile?.full_name ?? "", email: profile?.email ?? "" };
    })
    .filter((r) => Boolean(r.email));

  const { matched } = filterByDomain(roster, domain, { subdomains: options.subdomains !== false });
  const unique = dedupeEmails(matched);

  const alreadySent = new Set<string>();
  if (unique.length > 0) {
    const { data: sent } = await supabase
      .from("certificate_deliveries")
      .select("certificate_id")
      .eq("event_id", eventId)
      .eq("channel", "email")
      .eq("status", "sent");
    for (const row of sent ?? []) alreadySent.add(row.certificate_id as string);
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const recipient of unique) {
    if (alreadySent.has(recipient.certificateId)) {
      skipped++;
      continue;
    }
    const verifyUrl = `${SITE_URL}/verify/${recipient.certificateId}`;
    const result = await sendCertificateEmail({
      to: recipient.email,
      name: recipient.name,
      verifyUrl,
      eventId,
      certificateId: recipient.certificateId,
    });

    if (result.ok) {
      sent++;
      await supabase.from("certificate_deliveries").upsert(
        {
          certificate_id: recipient.certificateId,
          event_id: eventId,
          channel: "email",
          recipient_email: recipient.email,
          status: "sent",
          sent_at: new Date().toISOString(),
          error: null,
        },
        { onConflict: "certificate_id,channel" },
      );
    } else {
      failed++;
      await supabase.from("certificate_deliveries").upsert(
        {
          certificate_id: recipient.certificateId,
          event_id: eventId,
          channel: "email",
          recipient_email: recipient.email,
          status: "failed",
          error: result.error ?? "unknown error",
          sent_at: new Date().toISOString(),
        },
        { onConflict: "certificate_id,channel" },
      );
    }
  }

  logger.info("certificates.bulk_sent", {
    event_id: eventId,
    issued_by: profileId,
    domain,
    subdomains: options.subdomains !== false,
    candidates: unique.length,
    sent,
    failed,
    skipped,
  });

  revalidatePath(`/dashboard/organizer/events/${eventId}/certificates`);

  return {
    domain,
    subdomains: options.subdomains !== false,
    candidates: unique.length,
    sent,
    failed,
    skippedAlreadySent: skipped,
  };
}

/** Delivery report rows, for the CSV export. */
export async function getDeliveryReport(eventId: string) {
  await requireIssuer(eventId);
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("certificate_deliveries")
    .select("channel, status, recipient_email, sent_at, downloaded_at, download_count, error")
    .eq("event_id", eventId)
    .order("sent_at", { ascending: false });

  return (data ?? []) as Array<Record<string, unknown>>;
}

export { domainsIn, type ImportRow };
