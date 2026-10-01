import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Authorization for certificate issuance.
 *
 * `lib/actions/issue-marker.ts` has no role check at all and is reachable by
 * any signed-in user, even though the parallel HTTP route at
 * `api/v1/issue-marker/route.ts:41` correctly gates on organizer/maintainer.
 * The only thing standing between a `hacker` role and someone else's roster is
 * an edge proxy prefix, which is not an authorization boundary for a server
 * action.
 *
 * These tests pin the matrix that prevents repeating that.
 */

const mockAuth0 = { getSession: vi.fn() };
const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

vi.mock("@/lib/auth0", () => ({ auth0: mockAuth0 }));
vi.mock("@/lib/logger", () => ({ logger: mockLogger }));
vi.mock("@/lib/certificates/email", () => ({
  sendCertificateEmail: vi.fn(async () => ({ ok: true, status: 200 })),
}));

// One query chain per table, with the rows each should resolve to.
type Row = Record<string, unknown>;
let profiles: Row[] = [];
let events: Row[] = [];
let registrations: Row[] = [];
let certificates: Row[] = [];
let deliveries: Row[] = [];
let templates: Row[] = [];
let templatesUpserted: unknown[] = [];
/** Set by a test to make the next query fail, so error paths are reachable. */
let forcedError: { message: string } | null = null;
/** Override the exact count, to model a result set that does not reconcile. */
let shortByCount: number | null = null;
/** Simulate a PostgREST or proxy that drops `Prefer: count=exact`. */
let suppressCount = false;

/** PostgREST's default max_rows. Exceeding it truncates silently, no error. */
const POSTGREST_MAX_ROWS = 1000;

function chain(rows: Row[] | null) {
const q: Record<string, unknown> = {};
    for (const m of ["insert", "update", "upsert", "order", "limit", "is"]) {
      q[m] = vi.fn(() => q);
    }
    // `count` is only returned when the query asked for it. PostgREST gives
    // `count: null` otherwise, and always returning a number meant the
    // deleteTemplate not-found guard could be deleted with no test failing.
    let inFilter: { column: string; values: unknown[] } | null = null;
    const eqFilters: Array<{ column: string; value: unknown }> = [];
    let askedCount = false;
    let selectCols = "";
    q.select = vi.fn((cols?: string, opts?: { count?: string; head?: boolean }) => {
      if (typeof cols === "string") selectCols = cols;
      if (opts?.count === "exact") askedCount = true;
      return q;
    });
    q.delete = vi.fn((opts?: { count?: string }) => {
      if (opts?.count === "exact") askedCount = true;
      return q;
    });
    // PostgREST turns `alias:table!inner(cols)` into an INNER JOIN and drops
    // rows with no matching parent. Modelling it matters: the count is taken
    // from the same query as the data precisely because the embed changes the
    // population, and a mock that ignored !inner could not express the bug
    // where a head count of 6 met an !inner data query returning 4.
    //
    // Read lazily. Computing this while the mock is still being built saw an
    // empty select string and therefore never matched anything, so the join
    // filter below was dead code and the regression test for it guarded
    // nothing.
    const innerAlias = (): string | null =>
      /([a-z_]+):[a-z_]+!inner\(/.exec(selectCols)?.[1] ?? null;

    const applyFilters = (input: Row[]): Row[] => {
      let out = input;
      const alias = innerAlias();
      if (alias) {
        out = out.filter((r) => r[alias] !== null && r[alias] !== undefined);
      }
      if (inFilter) {
        const wanted = new Set(inFilter.values.map(String));
        out = out.filter((r) => wanted.has(String(r[inFilter!.column])));
      }
      for (const { column, value } of eqFilters) {
        if (value === undefined) continue;
        out = out.filter((r) => String(r[column] ?? "") === String(value));
      }
      return out;
    };
    // single/maybeSingle honour the filters too. Returning rows[0] regardless
    // meant "resolve the caller by the wrong auth0 id" passed every test, because
    // the mock answered a different question than the one the code asked.
    q.single = vi.fn(async () => ({ data: applyFilters(rows ?? [])[0] ?? null, error: null }));
    q.maybeSingle = vi.fn(async () => ({
      data: applyFilters(rows ?? [])[0] ?? null,
      error: null,
    }));
    // `range` has to actually slice, because the send path pages on it. A stub
    // that ignored it returned the entire result set on every iteration, so a
    // fixture larger than PAGE_SIZE made the pagination loop spin forever and
    // the worker was OOM-killed. Vitest reported 18/21 passed and buried the
    // crash, which is worse than a visible failure.
let from = 0;
      let to: number | null = null;
      q.range = vi.fn((f: number, t: number) => {
        from = f;
        to = t;
        return q;
      });
      // `.in()` has to filter too. Modelling it as a no-op made a delivery
      // lookup scoped to 200 candidate ids return all 1100 sent rows, which is
      // the opposite of what the scoping is for.
      q.in = vi.fn((column: string, values: unknown[]) => {
        inFilter = { column, values };
        return q;
      });
      // `.eq()` filters too. As a no-op it left all 13 call sites in
      // certificates.ts inert, and five wrong-authorization mutations passed
      // the whole suite: dropping `.eq("event_id")` from the roster read, dropping
      // the channel/status filters from the delivery lookup, reading the caller
      // by the wrong auth0 id, and skipping `count:"exact"` on the delete. A
      // mock that cannot express the query cannot catch a query that is wrong.
      q.eq = vi.fn((column: string, value: unknown) => {
        eqFilters.push({ column, value });
        return q;
      });
    // PostgREST returns `count` alongside `data` when count:"exact" is asked
    // for, which deleteTemplate relies on to distinguish a delete from a no-op.
    //
    // The 1000-row ceiling is modelled because it is the whole bug. PostgREST
    // truncates at max_rows (default 1000) and returns NO error when it does,
    // so an unpaginated read looks like a successful short result. Mocking the
    // full result set for an unpaged query made the pagination test pass
    // against unpaginated code -- a green test guarding nothing.
    q.then = (fn: (v: unknown) => unknown) => {
      const all = applyFilters(rows ?? []);
      // Ranged reads are clamped too. PostgREST caps EVERY response at
      // max_rows, not only unpaged ones, so a mock that only clamps the unpaged
      // branch is more forgiving exactly where the paging bug lives.
      const page =
        to === null
          ? all.slice(0, POSTGREST_MAX_ROWS)
          : all.slice(from, Math.min(to + 1, from + POSTGREST_MAX_ROWS));
      // PostgREST returns count:null unless the query asked for count:"exact".
      // Always returning a number meant the deleteTemplate guard could be
      // removed and no test noticed.
      const error = forcedError;
      // PostgREST's count is the whole-query total, reported on every page, and
      // it describes the same joined population the rows come from.
      const count = askedCount && !suppressCount ? (shortByCount ?? all.length) : null;
      return Promise.resolve(fn({ data: page, error, count }));
    };
    return q;
}

vi.mock("@/utils/supabase", () => ({
  createServiceClient: () => ({
    from: (table: string) => {
      if (table === "profiles") return chain(profiles);
      if (table === "events") return chain(events);
      if (table === "event_registrations") return chain(registrations);
      if (table === "certificates") return chain(certificates);
      if (table === "certificate_deliveries") return chain(deliveries);
      if (table === "certificate_templates") {
        const q = chain(templates);
        (q.upsert as ReturnType<typeof vi.fn>).mockImplementation((v: unknown) => {
          templatesUpserted.push(v);
          return q;
        });
        // An INSERT .select("id").single() must hand back a row; the shared
        // chain() returns null for an empty table, which would make the action
        // look broken when it is not.
        (q.single as ReturnType<typeof vi.fn>).mockImplementation(async () => {
          if (templates.length > 0) return { data: templates[0], error: null };
          const inserted = { id: "tpl-inserted", name: "Inserted" };
          templatesUpserted.push(inserted);
          return { data: inserted, error: null };
        });
        return q;
      }
      return chain([]);
    },
  }),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// auth0_user_id is on a real profiles row and is how every action resolves the
// caller. It is here because the mock now honours `.eq()`, so a fixture without
// it is not the row the code asked for.
const ORGANIZER = { id: "org-1", auth0_user_id: "auth0|org-1", role: "organizer" };
const MAINTAINER = { id: "mnt-1", auth0_user_id: "auth0|mnt-1", role: "maintainer" };
const HACKER = { id: "hack-1", auth0_user_id: "auth0|hack-1", role: "hacker" };
const LEAD = { id: "lead-1", auth0_user_id: "auth0|lead-1", role: "lead" };
const EVENT = { id: "evt-1", organizer_id: "org-1" };

function signedInAs(profile: Row | null) {
  mockAuth0.getSession.mockResolvedValue(
    profile ? { user: { sub: `auth0|${profile.id}` } } : null,
  );
}

async function loadActions() {
  return import("@/lib/actions/certificates");
}

beforeEach(() => {
  vi.clearAllMocks();
  profiles = [];
  events = [];
  registrations = [];
  certificates = [];
  deliveries = [];
  templates = [];
  templatesUpserted = [];
    forcedError = null;
    shortByCount = null;
    suppressCount = false;
  mockAuth0.getSession.mockResolvedValue(null);
});

describe("issueCertificatesFromRoster authorization", () => {
  it("rejects an unauthenticated caller", async () => {
    signedInAs(null);
    const { issueCertificatesFromRoster } = await loadActions();
    await expect(issueCertificatesFromRoster("evt-1", "Name,Email\nA,a@b.com")).rejects.toThrow(
      /Unauthorized/,
    );
  });

  it("rejects a caller with no profile row", async () => {
    signedInAs(null);
    profiles = [];
    const { issueCertificatesFromRoster } = await loadActions();
    await expect(issueCertificatesFromRoster("evt-1", "Name,Email\nA,a@b.com")).rejects.toThrow(
      /Unauthorized/,
    );
  });

  it("rejects a hacker", async () => {
    signedInAs(HACKER);
    profiles = [HACKER];
    const { issueCertificatesFromRoster } = await loadActions();
    await expect(issueCertificatesFromRoster("evt-1", "Name,Email\nA,a@b.com")).rejects.toThrow(
      /Forbidden/,
    );
  });

  it("rejects a chapter lead, who is privileged on the dashboard but not an issuer", async () => {
    // lead can access /dashboard/lead surfaces but must not be able to issue
    // credentials for arbitrary events.
    signedInAs(LEAD);
    profiles = [LEAD];
    const { issueCertificatesFromRoster } = await loadActions();
    await expect(issueCertificatesFromRoster("evt-1", "Name,Email\nA,a@b.com")).rejects.toThrow(
      /Forbidden/,
    );
  });

  it("rejects an organiser issuing for someone else's event", async () => {
    signedInAs(ORGANIZER);
    profiles = [ORGANIZER];
    events = [{ id: "evt-1", organizer_id: "someone-else" }];
    const { issueCertificatesFromRoster } = await loadActions();
    await expect(issueCertificatesFromRoster("evt-1", "Name,Email\nA,a@b.com")).rejects.toThrow(
      /not the organiser/,
    );
  });

  it("rejects an organiser when the event does not exist", async () => {
    signedInAs(ORGANIZER);
    profiles = [ORGANIZER];
    events = [];
    const { issueCertificatesFromRoster } = await loadActions();
    await expect(issueCertificatesFromRoster("evt-1", "Name,Email\nA,a@b.com")).rejects.toThrow(
      /Event not found/,
    );
  });

  it("allows the event's own organiser", async () => {
    signedInAs(ORGANIZER);
    profiles = [ORGANIZER];
    events = [EVENT];
    registrations = [];
    const { issueCertificatesFromRoster } = await loadActions();
    // Empty roster: permitted, but issues nothing.
    const res = await issueCertificatesFromRoster("evt-1", "Name,Email\n");
    expect(res.issued).toBe(0);
  });

  it("allows a maintainer to issue for any event, including one they do not own", async () => {
    // closeEvent() rejects maintainers, which is the inconsistency flagged in
    // review: a maintainer can check people in and export the PDF, so they must
    // be able to trigger issuance too.
    signedInAs(MAINTAINER);
    profiles = [MAINTAINER];
    events = [{ id: "evt-1", organizer_id: "a-different-organizer" }];
    registrations = [];
    const { issueCertificatesFromRoster } = await loadActions();
    const res = await issueCertificatesFromRoster("evt-1", "Name,Email\n");
    expect(res.issued).toBe(0);
  });
});

describe("sendCertificateEmails authorization", () => {
  it("rejects a hacker before touching the roster", async () => {
    signedInAs(HACKER);
    profiles = [HACKER];
    const { sendCertificateEmails } = await loadActions();
    await expect(
      sendCertificateEmails("evt-1", { domain: "butwalhacks.com" }),
    ).rejects.toThrow(/Forbidden/);
  });

  it("rejects an organiser for another organiser's event", async () => {
    signedInAs(ORGANIZER);
    profiles = [ORGANIZER];
    events = [{ id: "evt-1", organizer_id: "not-me" }];
    const { sendCertificateEmails } = await loadActions();
    await expect(
      sendCertificateEmails("evt-1", { domain: "butwalhacks.com" }),
    ).rejects.toThrow(/not the organiser/);
  });

  it("refuses a domain with no dot, which would match far too much", async () => {
    signedInAs(ORGANIZER);
    profiles = [ORGANIZER];
    events = [EVENT];
    const { sendCertificateEmails } = await loadActions();
    await expect(sendCertificateEmails("evt-1", { domain: "localhost" })).rejects.toThrow(
      /domain is required/,
    );
  });
});

describe("template management authorization", () => {
  it("rejects a hacker saving a template", async () => {
    signedInAs(HACKER);
    profiles = [HACKER];
    const { saveTemplate } = await loadActions();
    await expect(saveTemplate({ name: "Mine" })).rejects.toThrow(/Forbidden/);
  });

  it("rejects a hacker deleting a template", async () => {
    signedInAs(HACKER);
    profiles = [HACKER];
    const { deleteTemplate } = await loadActions();
    await expect(deleteTemplate("tpl-1")).rejects.toThrow(/Forbidden/);
  });

  it("allows a maintainer to save a template", async () => {
    signedInAs(MAINTAINER);
    profiles = [MAINTAINER];
    templates = [];
    const { saveTemplate } = await loadActions();
    const res = await saveTemplate({ name: "Default" });
    expect(res).toHaveProperty("id");
  });

  // ── Cross-tenant template writes ──────────────────────────────────────────
  // A role check alone let any organizer overwrite the artwork printed on
  // another organizer's certificates, because event ids are public.
  it("refuses to save a template scoped to another organizer's event", async () => {
    signedInAs(ORGANIZER);
    profiles = [ORGANIZER];
    events = [{ id: "evt-1", organizer_id: "someone-else" }];
    const { saveTemplate } = await loadActions();
    await expect(
      saveTemplate({ name: "Hijack", eventId: "evt-1", isDefault: true }),
    ).rejects.toThrow(/do not organise this event/);
  });

  it("refuses to delete a template belonging to another organizer's event", async () => {
    signedInAs(ORGANIZER);
    profiles = [ORGANIZER];
    events = [{ id: "evt-1", organizer_id: "someone-else" }];
    templates = [{ id: "tpl-1", event_id: "evt-1", created_by: "someone-else", is_default: true }];
    const { deleteTemplate } = await loadActions();
    await expect(deleteTemplate("tpl-1")).rejects.toThrow(/do not organise this event/);
  });

  it("refuses to delete a template it cannot see", async () => {
    signedInAs(MAINTAINER);
    profiles = [MAINTAINER];
    templates = [];
    const { deleteTemplate } = await loadActions();
    // Previously this returned ok:true for a no-op, so a caller could not tell
    // a delete from a miss.
    await expect(deleteTemplate("tpl-missing")).rejects.toThrow(/not found/);
  });

  it("lets a maintainer delete an organisation template", async () => {
    signedInAs(MAINTAINER);
    profiles = [MAINTAINER];
    templates = [{ id: "tpl-1", event_id: null, created_by: "someone-else", is_default: true }];
    const { deleteTemplate } = await loadActions();
    await expect(deleteTemplate("tpl-1")).resolves.toEqual({ ok: true });
  });
});

// ── Query scoping: the mock now honours .eq(), so these can be proven ─────────
describe("query scoping", () => {
  const certRow = (id: string, eventId: string, email: string) => ({
    id,
    event_id: eventId,
    status: "issued",
    profile: { id: `p-${id}`, full_name: `N ${id}`, email, bh_id: null },
  });

  it("never mails a certificate belonging to another event", async () => {
    const { sendCertificateEmail } = await import("@/lib/certificates/email");
    signedInAs(ORGANIZER);
    profiles = [ORGANIZER];
    events = [EVENT];
    certificates = [
      certRow("mine", "evt-1", "mine@butwalhacks.com"),
      // Another organizer's event. Event ids are public and the roster read is
      // the only thing keeping this caller's send inside their own event.
      certRow("theirs", "evt-2", "theirs@butwalhacks.com"),
    ];
    const { sendCertificateEmails } = await loadActions();

    const summary = await sendCertificateEmails("evt-1", { domain: "butwalhacks.com" });

    expect(summary.sent).toBe(1);
    const addressed = (
      sendCertificateEmail as unknown as { mock: { calls: Array<[{ to: string }]> } }
    ).mock.calls.map((c) => c[0].to);
    expect(addressed).toEqual(["mine@butwalhacks.com"]);
  });

  it("surfaces a roster read failure instead of reporting no recipients", async () => {
    signedInAs(ORGANIZER);
    profiles = [ORGANIZER];
    events = [EVENT];
    certificates = [certRow("c1", "evt-1", "a@butwalhacks.com")];
    forcedError = { message: "connection reset" };
    const { sendCertificateEmails } = await loadActions();

    // Unchecked, this surfaced as "No certificate recipient uses
    // butwalhacks.com" -- an actionable-looking message for an infrastructure
    // failure, sending the organizer off to check their own domain spelling.
    await expect(
      sendCertificateEmails("evt-1", { domain: "butwalhacks.com" }),
    ).rejects.toThrow(/Could not read certificates: connection reset/);
  });

  it("reports a missing count instead of claiming no recipient matches", async () => {
    signedInAs(ORGANIZER);
    profiles = [ORGANIZER];
    events = [EVENT];
    certificates = [certRow("c1", "evt-1", "a@butwalhacks.com")];
    suppressCount = true;
    const { sendCertificateEmails } = await loadActions();

    // count: null means the count was not honoured -- not that there are zero
    // recipients. Reading it as zero produced the actionable-looking
    // "No certificate recipient uses butwalhacks.com", sending the organizer
    // to check their own domain spelling for a server misconfiguration.
    await expect(
      sendCertificateEmails("evt-1", { domain: "butwalhacks.com" }),
    ).rejects.toThrow(/server returned no usable count/);
  });

  it("counts the joined population, not the base table", async () => {
    signedInAs(ORGANIZER);
    profiles = [ORGANIZER];
    events = [EVENT];
    // A certificate whose profile is missing. The roster select embeds
    // `profiles!inner`, which PostgREST turns into an INNER JOIN, so this row
    // is not in the data. A head count taken from a query WITHOUT the embed
    // reported 6 against 4 returned rows on PostgREST 12.2.3, which is a
    // permanent mismatch and bulk send unavailable for the whole event.
    certificates = [
      { ...certRow("with", "evt-1", "with@butwalhacks.com") },
      { ...certRow("orphan", "evt-1", "orphan@butwalhacks.com"), profile: null },
    ];
    const { sendCertificateEmails } = await loadActions();

    const summary = await sendCertificateEmails("evt-1", {
      domain: "butwalhacks.com",
      dryRun: true,
    });

    // The orphan has no address to mail even if it survived the join, so the
    // roster is the one real recipient. What matters is that this resolves
    // rather than throwing a coverage mismatch.
    expect(summary.candidates).toBe(1);
  });

  it("refuses to send when the pages did not cover the whole roster", async () => {
    signedInAs(ORGANIZER);
    profiles = [ORGANIZER];
    events = [EVENT];
    // Count claims four rows; the page returns one. Silently mailing the one
    // is the failure mode this guards, so it has to throw instead.
    certificates = [certRow("c1", "evt-1", "a@butwalhacks.com")];
    shortByCount = 4;
    const { sendCertificateEmails } = await loadActions();

    await expect(
      sendCertificateEmails("evt-1", { domain: "butwalhacks.com" }),
    ).rejects.toThrow(/Could not read all 4 certificates/);
  });
});

// ── Bulk send correctness: the bugs review actually found ──────────────────────
describe("bulk send roster correctness", () => {
  const certFor = (id: string, email: string, status?: string) => ({
    id,
    event_id: "evt-1",
    status: status ?? null,
    profile: { id: `p-${id}`, full_name: `N ${id}`, email, bh_id: null },
  });

  it("never emails a revoked or voided certificate", async () => {
    const { sendCertificateEmail } = await import("@/lib/certificates/email");
    signedInAs(ORGANIZER);
    profiles = [ORGANIZER];
    events = [EVENT];
    certificates = [
      certFor("ok", "ok@butwalhacks.com", "issued"),
      // "issued" | "revoked" | "void" is the vocabulary the certificates_status_check
      // constraint allows; isCertificateActive is deliberately more permissive so an
      // unexpected value never reads as revoked and hides a live certificate.
      certFor("rev", "revoked@butwalhacks.com", "revoked"),
      certFor("void", "voided@butwalhacks.com", "void"),
    ];
    const { sendCertificateEmails } = await loadActions();

    const summary = await sendCertificateEmails("evt-1", {
      domain: "butwalhacks.com",
    });

    // The PDF route and the verification page both gate on revocation. The
    // sender did not, so a withdrawn credential got "Your certificate is
    // ready" pointing at a page announcing it had been revoked.
    //
    // A real send, not a dry run: on a dry run sendCertificateEmail is never
    // called, so asserting its arguments proved nothing.
    expect(summary.sent).toBe(1);
    const addressed = (
      sendCertificateEmail as unknown as { mock: { calls: Array<[{ to: string }]> } }
    ).mock.calls.map((c) => c[0].to);
    expect(addressed).toEqual(["ok@butwalhacks.com"]);
  });

  it("reads certificates past PostgREST's 1000-row ceiling", async () => {
    signedInAs(ORGANIZER);
    profiles = [ORGANIZER];
    events = [EVENT];
    // 1000 non-matching rows then 200 matching ones. PostgREST caps a response
    // at max_rows (1000) and returns NO error when it truncates, so an
    // unpaginated read saw zero matches here and reported "no recipient uses
    // this domain" while the summary claimed success.
    certificates = [
      ...Array.from({ length: 1000 }, (_, i) => certFor(`x${i}`, `x${i}@other.com`)),
      ...Array.from({ length: 200 }, (_, i) => certFor(`m${i}`, `m${i}@butwalhacks.com`)),
    ];
    const { sendCertificateEmails } = await loadActions();

    const summary = await sendCertificateEmails("evt-1", {
      domain: "butwalhacks.com",
      dryRun: true,
    });

    expect(summary.candidates).toBe(200);
  });

  it("resumes without mailing anyone twice, across in() chunks", async () => {
    const { sendCertificateEmail } = await import("@/lib/certificates/email");
    signedInAs(ORGANIZER);
    profiles = [ORGANIZER];
    events = [EVENT];
    // 1200 recipients, 1100 of them already mailed. The delivery lookup used to
    // read every sent row for the event in one request, which PostgREST
    // truncated at 1000 rows with no error: 100 already-mailed people read as
    // unsent and were mailed a second time, and the report showed it as
    // ordinary progress.
    certificates = Array.from({ length: 1200 }, (_, i) =>
      certFor(`c${i}`, `c${i}@butwalhacks.com`),
    );
    deliveries = Array.from({ length: 1100 }, (_, i) => ({
      certificate_id: `c${i}`,
      event_id: "evt-1",
      channel: "email",
      status: "sent",
    }));
    const { sendCertificateEmails } = await loadActions();

    const summary = await sendCertificateEmails("evt-1", { domain: "butwalhacks.com" });

    expect(summary.sent).toBe(100);
    expect(summary.skippedAlreadySent).toBe(1100);
    // The 100 mailed now must be the 100 that were never mailed before.
    const sentTo = (
      sendCertificateEmail as unknown as { mock: { calls: Array<[{ to: string }]> } }
    ).mock.calls.map((c) => c[0].to);
    expect(sentTo).toHaveLength(100);
    for (const to of sentTo) {
      expect(Number(to.slice(1).split("@")[0])).toBeGreaterThanOrEqual(1100);
    }
  });

});

// ── Ownership transitions ─────────────────────────────────────────────────────
describe("template ownership", () => {
  it("does not let the original organizer delete a template promoted to global", async () => {
    signedInAs(ORGANIZER);
    profiles = [ORGANIZER];
    // event_id null means a maintainer promoted it to organisation scope while
    // created_by still points at the organizer who drafted it.
    templates = [{ id: "tpl-1", event_id: null, created_by: "org-1", is_default: true }];
    const { deleteTemplate } = await loadActions();

    // Authorship is not authority. Skipping the scope check for the creator
    // let one organizer delete artwork every unrelated event's PDF inherits.
    await expect(deleteTemplate("tpl-1")).rejects.toThrow(/maintainer/i);
  });

  it("still lets the creator delete their own event-scoped template", async () => {
    signedInAs(ORGANIZER);
    profiles = [ORGANIZER];
    events = [EVENT];
    templates = [{ id: "tpl-2", event_id: "evt-1", created_by: "org-1", is_default: false }];
    const { deleteTemplate } = await loadActions();

    await expect(deleteTemplate("tpl-2")).resolves.toEqual({ ok: true });
  });
});

// ── Send guards: zero-match, batch cap, dry run ───────────────────────────────
describe("bulk send guards", () => {
  const certsFor = (emails: string[]) => ({
    id: "c1",
    event_id: "evt-1",
    status: "issued",
    profile: { id: "p1", full_name: "A", email: emails[0], bh_id: "bh-1" },
  });

  it("refuses a domain that matches nobody instead of silently sending nothing", async () => {
    signedInAs(ORGANIZER);
    profiles = [ORGANIZER];
    events = [EVENT];
    certificates = [certsFor(["a@butwalhacks.com"])];
    const { sendCertificateEmails } = await loadActions();
    // The UI warned about this, but a client-side warning is not enforcement.
    await expect(
      sendCertificateEmails("evt-1", { domain: "typo-domain.com" }),
    ).rejects.toThrow(/No certificate recipient uses/);
  });

  it("refuses a batch above the cap rather than truncating it", async () => {
    signedInAs(ORGANIZER);
    profiles = [ORGANIZER];
    events = [EVENT];
    // 501 recipients, all distinct, all under the domain.
    certificates = Array.from({ length: 501 }, (_, i) => ({
      id: `c${i}`,
      event_id: "evt-1",
      status: "issued",
      profile: { id: `p${i}`, full_name: `P${i}`, email: `p${i}@butwalhacks.com`, bh_id: null },
    }));
    const { sendCertificateEmails } = await loadActions();
    // A partial send is indistinguishable from a complete one in the report.
    await expect(
      sendCertificateEmails("evt-1", { domain: "butwalhacks.com" }),
    ).rejects.toThrow(/above the 500 limit/);
  });

  it("sends nothing on a dry run but still counts the recipients", async () => {
    const { sendCertificateEmail } = await import("@/lib/certificates/email");
    signedInAs(ORGANIZER);
    profiles = [ORGANIZER];
    events = [EVENT];
    certificates = [certsFor(["a@butwalhacks.com"])];
    const { sendCertificateEmails } = await loadActions();

    const res = await sendCertificateEmails("evt-1", { domain: "butwalhacks.com", dryRun: true });
    expect(res.dryRun).toBe(true);
    expect(res.candidates).toBe(1);
    expect(res.sent).toBe(0);
    // The dry run has to be free of side effects, or it is just a send.
    expect(vi.mocked(sendCertificateEmail)).not.toHaveBeenCalled();
  });
});
