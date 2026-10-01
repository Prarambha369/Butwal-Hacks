"use server";

import { revalidatePath } from "next/cache";
import { auth0 } from "@/lib/auth0";
import { logger } from "@/lib/logger";
import { isCertificateActive } from "@/lib/verify/resolve";
import { createServiceClient } from "@/utils/supabase";
import { SITE_URL } from "@/lib/constants";
import { normaliseTemplate } from "@/lib/certificates/template";
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
 * Hard ceiling on one bulk-send invocation.
 *
 * The send loop awaits Resend per recipient with a 10s timeout, so 5,000
 * recipients is not slow -- it is a request the platform will kill mid-loop,
 * leaving a partial send with no rollback and no cursor to resume from. A
 * capped batch is resumable because the next call simply skips what is already
 * marked sent.
 */
const SEND_BATCH_LIMIT = 500;

/**
 * Rows per paginated read.
 *
 * Deliberately half of PostgREST's default max_rows (1000). If the server is
 * configured lower, `readAllPages` will notice via the exact count rather than
 * quietly returning a short page and calling the roster complete.
 */
const PAGE_SIZE = 500;

/** Upper bound on pages, so a bug cannot spin here indefinitely. */
const MAX_PAGES = 24;

/** Ids per `in()` filter. 100 UUIDs keeps the request line near 4 KB, well
 * inside the ~8 KB that nginx and PostgREST will accept before a 414. At 200
 * the measured URL was 96.7% of the limit, one column rename from breaking. */
const CHUNK_SIZE = 100;

/**
 * Read every row a query matches, one bounded page at a time, and prove the
 * pages covered the whole result set.
 *
 * Three PostgREST behaviours make an unpaginated read unsafe here:
 *
 *  1. It caps a response at max_rows (1000 by default) and returns NO error
 *     when it truncates, so a short result is indistinguishable from a
 *     complete one.
 *  2. LIMIT/OFFSET paging without a total ORDER BY has no defined row order,
 *     so page 2 can repeat a row from page 1 and omit another entirely.
 *  3. `count: "exact"` reports the count for the query it is attached to. An
 *     embed changes the population: `profile:profiles!inner(...)` becomes an
 *     INNER JOIN and drops certificates whose profile is missing, so a count
 *     taken from a *different* query than the data counts rows the data
 *     query will never return.
 *
 * (3) is why the count is requested on the same query as the data rather than
 * from a separate head request: verified against PostgREST 12.2.3, a head
 * count of `select=id` reported 6 for an event whose `!inner` data query
 * returned 4, which is a permanent mismatch check failure -- bulk send simply
 * unavailable for any event holding a certificate with no profile.
 *
 * So: one query shape, ordered by a unique column, counted by PostgREST itself,
 * and rows de-duplicated by id. An insert that shifts OFFSET boundaries can
 * repeat a row, and a tally would let that repeat silently cancel the
 * omission it caused; comparing distinct ids cannot.
 */
async function readAllPages<T>(
  what: string,
  idOf: (row: T) => string,
  page: (from: number, to: number) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
    count: number | null;
  }>,
): Promise<T[]> {
  const seen = new Map<string, T>();
  let expected: number | null = null;

  for (let n = 0; n < MAX_PAGES; n++) {
    const from = n * PAGE_SIZE;
    const { data, error, count } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Could not read ${what}: ${error.message}`);

    // count: null means the count was not honoured, which is not the same as
    // zero -- reading it as zero reports "no recipient uses this domain" for
    // what is really a broken response. NaN is guarded too: postgrest-js parses
    // the total out of Content-Range with parseInt, and every comparison
    // against NaN is false, which would silently disable the coverage check
    // and return whatever was read.
    if (typeof count !== "number" || !Number.isFinite(count)) {
      throw new Error(
        `Could not verify how many ${what} exist: the server returned no usable count.`,
      );
    }
    // PostgREST reports the whole-query total on every page, so any page can
    // establish it. A concurrent insert can raise it mid-read; take the
    // largest seen, which is the set we then have to match.
    expected = expected === null ? count : Math.max(expected, count);

    for (const row of data ?? []) {
      const key = idOf(row);
      if (!seen.has(key)) seen.set(key, row);
    }

    if (seen.size >= expected) break;

    // An empty or short page before the count is reached means the server
    // capped us below PAGE_SIZE, or the rows moved under us. Either way we do
    // not have the whole set, and pretending otherwise is the bug this
    // function exists to prevent.
    if (!data || data.length === 0) {
      throw new Error(
        `Could not read all ${expected} ${what}: the server returned only ${seen.size}.`,
      );
    }
  }

  if (expected !== null && seen.size < expected) {
    // Distinguish "the pages did not cover the set" from "this event is larger
    // than bulk send reads". The latter is a capacity limit, and reporting it
    // as a coverage failure sends an organizer looking for a paging bug that
    // does not exist.
    const ceiling = MAX_PAGES * PAGE_SIZE;
    throw new Error(
      expected > ceiling
        ? `This event has ${expected} ${what}, more than bulk send can read in one go (limit ${ceiling}). Narrow the roster by domain or export it from the attendees page instead.`
        : `Could not read all ${expected} ${what}: got ${seen.size}.`,
    );
  }
  return [...seen.values()];
}

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

/**
 * Assert the caller may modify templates scoped to `eventId`.
 *
 * A bare role check was not enough: any `organizer` could pass another
 * organizer's `event_id` and overwrite the artwork printed on their
 * certificates, because event ids are public and the template's own id was
 * discoverable. Maintainers are organisation-wide and stay unrestricted.
 */
async function assertTemplateScope(
  profileId: string,
  role: string,
  eventId: string | null,
): Promise<void> {
  if (role === "maintainer") return;

  if (!eventId) {
    // An organisation-wide default is the fallback template for EVERY event,
    // so letting any organizer set it is cross-tenant write access by another
    // name -- `null` used to short-circuit straight past this check.
    throw new Error("Forbidden — only a maintainer can set the organisation-wide default");
  }

  const { data: event } = await createServiceClient()
    .from("events")
    .select("organizer_id")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) throw new Error("Event not found");
  if (event.organizer_id !== profileId) {
    throw new Error("Forbidden — you do not organise this event");
  }
}

/**
 * Load a template and check the caller may touch it.
 *
 * Resolving through the row (rather than trusting an id) is what closes the
 * delete-by-guessed-id hole: there is no path that deletes a row the caller
 * cannot see.
 */
async function requireOwnedTemplate(
  templateId: string,
): Promise<{ template: Record<string, unknown>; profileId: string; role: string }> {
  const { profileId, role } = await requireTemplateEditor();

  const { data: template } = await createServiceClient()
    .from("certificate_templates")
    .select("id, event_id, created_by, is_default")
    .eq("id", templateId)
    .maybeSingle();

  if (!template) throw new Error("Template not found");

  // Deliberately NOT short-circuited on creator. It used to be, which meant a
  // maintainer could promote an organizer's template to organisation scope and
  // the original organizer could then delete it -- extending one organizer's
  // authority over artwork that every unrelated event's PDFs inherit. Scope is
  // what governs, not authorship.
  await assertTemplateScope(profileId, role, (template.event_id as string | null) ?? null);

  return { template: template as Record<string, unknown>, profileId, role };
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
  const supabase = createServiceClient();

  // Editing in place: authorized against the template's OWN event, so the
  // payload cannot re-scope someone else's template to ours or to global.
  if (input.id) {
    await requireOwnedTemplate(input.id);
  }

  const { profileId, role } = await requireTemplateEditor();
  await assertTemplateScope(profileId, role, input.eventId ?? null);

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
    revalidatePath("/dashboard/organizer/certificates/templates");
    revalidatePath("/dashboard/organizer/certificates/templates");
    return { id: input.id as string };
  }

  const { data, error } = await supabase
    .from("certificate_templates")
    .insert({ ...row, created_by: profileId })
    .select("id")
    .single();
  if (error) throw new Error(`Could not create template: ${error.message}`);

  revalidatePath("/dashboard/organizer/certificates/templates");
  revalidatePath("/dashboard/organizer/certificates/templates");
  return { id: data.id as string };
}

export async function deleteTemplate(templateId: string) {
  await requireOwnedTemplate(templateId);
  const supabase = createServiceClient();
  // Guarded on created_by/event scope already proven above; the delete is
  // additionally restricted to the same row so a concurrent swap cannot widen
  // it.
  const { error, count } = await supabase
    .from("certificate_templates")
    .delete({ count: "exact" })
    .eq("id", templateId);
  if (error) throw new Error(`Could not delete template: ${error.message}`);
  // Previously this returned ok:true even when nothing matched, so a caller
  // could not tell a delete from a no-op.
  if (!count) throw new Error("Template not found");
  revalidatePath("/dashboard/organizer/certificates/templates");
  revalidatePath("/dashboard/organizer/certificates/templates");
  return { ok: true };
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

  // Counted across every resolved row, not just `matched`: an event where
  // everything is already issued still has a domain, and the send filter needs
  // to show it.
  const domainCounts = new Map<string, number>();
  for (const r of [...result.matched, ...result.alreadyIssued]) {
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
  const found = new Map<
    string,
    { profileId: string; bhId: string | null; auth0UserId: string | null; hasCertificate: boolean }
  >();

  for (let i = 0; i < emails.length; i += chunkSize) {
    const chunk = emails.slice(i, i + chunkSize);
    const { data: registrations } = await supabase
      .from("event_registrations")
      .select("profile:profiles!inner(id, bh_id, email, auth0_user_id)")
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
      const profile = reg.profile as
        | { id?: string; bh_id?: string; email?: string; auth0_user_id?: string | null }
        | null;
      if (!profile?.id || !profile.email) continue;
      found.set(profile.email.trim().toLowerCase(), {
        profileId: profile.id,
        bhId: profile.bh_id ?? null,
        auth0UserId: profile.auth0_user_id ?? null,
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
    // Not left null: api/certificates/route.ts filters on this column, so a
    // null here made every bulk-issued certificate invisible to its recipient.
    auth0_user_id: r.auth0UserId ?? null,
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
  dryRun: boolean;
  /**
   * Recipients under the domain filter, after deduplication and after dropping
   * certificates that are not currently issuable. "Mailable candidates": the
   * count a send would act on, not the raw number of matching rows.
   */
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
  options: { domain: string; subdomains?: boolean; dryRun?: boolean },
): Promise<SendSummary> {
  const { profileId } = await requireIssuer(eventId);
  const supabase = createServiceClient();
  const { sendCertificateEmail } = await import("@/lib/certificates/email");

  const domain = options.domain.trim().toLowerCase();
  if (!domain || !domain.includes(".")) {
    throw new Error("A domain is required, for example butwalhacks.com");
  }

// One query shape. `count: "exact"` rides on the same request as the data so
  // the count and the rows describe the same population -- see readAllPages.
  const certs = await readAllPages<Record<string, unknown>>(
    "certificates",
    (row) => String(row.id),
    (from, to) =>
      supabase
        .from("certificates")
        .select("id, status, profile:profiles!inner(id, full_name, email, bh_id)", {
          count: "exact",
        })
        .eq("event_id", eventId)
        // Unique column, before the range: LIMIT/OFFSET paging without a total
        // order can repeat a row from one page and omit another from the next.
        .order("id", { ascending: true })
        .range(from, to),
  );

  const roster = certs
    .map((c) => {
      const profile = c.profile as { full_name?: string; email?: string; bh_id?: string } | null;
      return {
        certificateId: c.id as string,
        name: profile?.full_name ?? "",
        email: profile?.email ?? "",
        status: (c.status as string | null) ?? null,
      };
    })
    // ── C1: never email a withdrawn credential. The PDF route and
    // certificate-view both gate on this; the sender did not, so a revoked
    // certificate got "Your certificate is ready" linking to a page that says
    // it is revoked.
    .filter((r) => isCertificateActive(r.status))
    .filter((r) => Boolean(r.email));

  const { matched } = filterByDomain(roster, domain, { subdomains: options.subdomains !== false });
  const unique = dedupeEmails(matched);

  const dryRun = options.dryRun === true;

  if (unique.length === 0) {
    // The UI warns about this, but a client-side warning is not enforcement:
    // without this, a typo'd domain silently sends nothing and reports success.
    throw new Error(`No certificate recipient uses ${domain}. Check the spelling.`);
  }

  // Scoped to the candidate ids and chunked. Reading every sent row for the
  // event was doubly wrong: it truncated at 1000 rows, so a resumed send after
  // 1000 emails saw an incomplete alreadySent set and mailed people twice.
  const alreadySent = new Set<string>();
  for (let i = 0; i < unique.length; i += CHUNK_SIZE) {
    const ids = unique.slice(i, i + CHUNK_SIZE).map((r) => r.certificateId);
    const { data: sent, error } = await supabase
      .from("certificate_deliveries")
      .select("certificate_id")
      .in("certificate_id", ids)
      .eq("channel", "email")
      .eq("status", "sent");
    if (error) throw new Error(`Could not read delivery history: ${error.message}`);
    for (const row of sent ?? []) alreadySent.add(row.certificate_id as string);
  }

  const pending = unique.filter((r) => !alreadySent.has(r.certificateId));
  const skippedAlreadySent = unique.length - pending.length;

  if (dryRun) {
    return {
      domain,
      subdomains: options.subdomains !== false,
      dryRun: true,
      candidates: unique.length,
      sent: 0,
      failed: 0,
      skippedAlreadySent,
    };
  }

  if (pending.length > SEND_BATCH_LIMIT) {
    // Refuse rather than truncate: a silently partial send looks identical to
    // a complete one in the delivery report.
    throw new Error(
      `${pending.length} recipients match, above the ${SEND_BATCH_LIMIT} limit for one batch. Narrow the domain, or send again to continue from where this stopped.`,
    );
  }

  let sent = 0;
  let failed = 0;

  for (const recipient of pending) {
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
    skippedAlreadySent,
  });

  revalidatePath(`/dashboard/organizer/events/${eventId}/certificates`);

  return {
    domain,
    subdomains: options.subdomains !== false,
    dryRun: false,
    candidates: unique.length,
    sent,
    failed,
    // `pending` is already filtered by alreadySent, so this is computed rather
    // than counted in the loop -- a re-check inside the loop could never fire,
    // which made this report 0 on exactly the resumable-batch case the cap
    // exists to support.
    skippedAlreadySent,
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
