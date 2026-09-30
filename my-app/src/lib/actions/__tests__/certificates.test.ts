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

function chain(rows: Row[] | null) {
  const q: Record<string, unknown> = {};
  for (const m of ["select", "insert", "update", "delete", "upsert", "in", "eq", "order", "limit"]) {
    q[m] = vi.fn(() => q);
  }
  q.single = vi.fn(async () => ({ data: rows?.[0] ?? null, error: null }));
  q.maybeSingle = vi.fn(async () => ({ data: rows?.[0] ?? null, error: null }));
  // PostgREST returns `count` alongside `data` when count:"exact" is asked
  // for, which deleteTemplate relies on to distinguish a delete from a no-op.
  q.then = (fn: (v: unknown) => unknown) =>
    Promise.resolve(fn({ data: rows ?? [], error: null, count: rows?.length ?? 0 }));
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

const ORGANIZER = { id: "org-1", role: "organizer" };
const MAINTAINER = { id: "mnt-1", role: "maintainer" };
const HACKER = { id: "hack-1", role: "hacker" };
const LEAD = { id: "lead-1", role: "lead" };
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

// ── Send guards: zero-match, batch cap, dry run ───────────────────────────────
describe("bulk send guards", () => {
  const certsFor = (emails: string[]) => ({
    id: "c1",
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
