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
  q.then = (fn: (v: unknown) => unknown) => Promise.resolve(fn({ data: rows ?? [], error: null }));
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
});
