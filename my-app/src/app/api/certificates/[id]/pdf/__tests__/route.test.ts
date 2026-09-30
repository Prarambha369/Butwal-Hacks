import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The public certificate PDF route.
 *
 * The properties that matter are negative: a revoked certificate must not
 * print, an id that is not a UUID must not reach the database, and a response
 * must never be cacheable, because a cached PDF outlives its own revocation.
 */

// Hoisted: vi.mock factories run before the imports they substitute.
const h = vi.hoisted(() => ({
  mockResolve: vi.fn(),
  mockTemplate: vi.fn(),
  mockRender: vi.fn(),
  rpc: vi.fn(),
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("@/utils/supabase", () => ({
  createServiceClient: () => ({
    rpc: h.rpc,
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }),
  }),
}));
vi.mock("@/lib/verify/resolve", () => ({
  resolveVerifiable: h.mockResolve,
  isCertificateActive: (s?: string | null) => s !== "revoked" && s !== "void",
}));
vi.mock("@/lib/actions/certificates", () => ({ resolveTemplateForEvent: h.mockTemplate }));
vi.mock("@/lib/certificates/render", () => ({ renderCertificate: h.mockRender }));
vi.mock("@/lib/certificates/template", () => ({
  normaliseTemplate: (r: Record<string, unknown>) => ({ ...r, fields: [], name: "Built-in" }),
}));
vi.mock("@/lib/logger", () => ({ logger: h.logger }));

import { GET } from "@/app/api/certificates/[id]/pdf/route";

const ID = "11111111-2222-3333-4444-555555555555";
const req = new Request("https://www.butwalhacks.com/api/certificates/x/pdf");
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

const cert = (over: Record<string, unknown> = {}) => ({
  kind: "certificate" as const,
  certificate: {
    id: ID,
    issue_date: "2026-01-08",
    status: "issued",
    created_at: "2026-01-08",
    profile: { id: "p1", full_name: "Asha Sharma", bh_id: "bh-0123", email: "a@x.com" },
    events: { id: "evt-1", title: "Build In Public 2026" },
    ...over,
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  h.mockTemplate.mockResolvedValue({ id: "tpl-1", fields: [], pageWidth: 1056, pageHeight: 816, backgroundUrl: null });
  h.mockRender.mockResolvedValue({ bytes: new Uint8Array([37, 80, 68, 70, 45, 49, 46, 55]), warnings: [] });
  h.rpc.mockResolvedValue({ data: null, error: null });
});

describe("certificate PDF route", () => {
  it("returns a PDF", async () => {
    h.mockResolve.mockResolvedValue(cert());
    const res = await GET(req, ctx(ID));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    const buf = new Uint8Array(await res.arrayBuffer());
    expect(String.fromCharCode(...buf.slice(0, 5))).toBe("%PDF-");
  });

  it("never lets a certificate be cached", async () => {
    // A CDN-cached copy would still be printable after a revocation.
    h.mockResolve.mockResolvedValue(cert());
    const res = await GET(req, ctx(ID));
    expect(res.headers.get("Cache-Control")).toMatch(/no-store/);
  });

  it("sets a safe filename from the recipient name", async () => {
    h.mockResolve.mockResolvedValue(cert());
    const res = await GET(req, ctx(ID));
    expect(res.headers.get("Content-Disposition")).toMatch(/butwal-hacks-Asha-Sharma\.pdf/);
  });

  it("strips path traversal and separators out of the filename", async () => {
    h.mockResolve.mockResolvedValue(cert({ profile: { id: "p1", full_name: "../../etc/passwd", bh_id: null, email: null } }));
    const res = await GET(req, ctx(ID));
    const cd = res.headers.get("Content-Disposition") ?? "";
    expect(cd).not.toContain("/");
    expect(cd).not.toContain("..");
  });

  it("refuses to print a revoked certificate", async () => {
    h.mockResolve.mockResolvedValue(cert({ status: "revoked" }));
    const res = await GET(req, ctx(ID));
    expect(res.status).toBe(410);
    expect(h.mockRender).not.toHaveBeenCalled();
  });

  it("refuses to print a voided certificate", async () => {
    h.mockResolve.mockResolvedValue(cert({ status: "void" }));
    expect((await GET(req, ctx(ID))).status).toBe(410);
  });

  it("rejects a malformed id without touching the database", async () => {
    const res = await GET(req, ctx("../../etc/passwd"));
    expect(res.status).toBe(400);
    expect(h.mockResolve).not.toHaveBeenCalled();
  });

  it("404s an unknown id", async () => {
    h.mockResolve.mockResolvedValue(null);
    expect((await GET(req, ctx(ID))).status).toBe(404);
  });

  it("redirects a marker id to its verification page", async () => {
    h.mockResolve.mockResolvedValue({ kind: "marker", marker: { id: ID } });
    const res = await GET(req, ctx(ID));
    expect(res.status).toBe(307);
    expect(res.headers.get("Location")).toBe(`/verify/${ID}`);
  });

  it("still prints when no template has been designed yet", async () => {
    // A missing template is a supported state, not an outage.
    h.mockTemplate.mockResolvedValue(null);
    h.mockResolve.mockResolvedValue(cert());
    const res = await GET(req, ctx(ID));
    expect(res.status).toBe(200);
  });

  it("logs render warnings instead of swallowing them", async () => {
    h.mockRender.mockResolvedValue({ bytes: new Uint8Array([37, 80, 68, 70]), warnings: ["Devanagari cannot render"] });
    h.mockResolve.mockResolvedValue(cert());
    await GET(req, ctx(ID));
    expect(h.logger.warn).toHaveBeenCalledWith("certificate.pdf.warnings", expect.objectContaining({ warnings: expect.arrayContaining(["Devanagari cannot render"]) }));
  });

  it("500s rather than serving a half-built file if rendering throws", async () => {
    h.mockRender.mockRejectedValue(new Error("pdf-lib exploded"));
    h.mockResolve.mockResolvedValue(cert());
    const res = await GET(req, ctx(ID));
    expect(res.status).toBe(500);
    expect(res.headers.get("Content-Type")).toBe("application/json");
  });

  it("counts the download", async () => {
    h.mockResolve.mockResolvedValue(cert());
    await GET(req, ctx(ID));
    expect(h.rpc).toHaveBeenCalledWith("record_certificate_download", {
      p_certificate_id: ID,
      p_event_id: "evt-1",
    });
  });

  it("rejects a certificate with no linked event, rather than rendering a blank", async () => {
    h.mockResolve.mockResolvedValue(cert({ events: null }));
    const res = await GET(req, ctx(ID));
    expect(res.status).toBe(422);
    expect(h.mockRender).not.toHaveBeenCalled();
  });

  it("passes the recipient name and a verification URL to the renderer", async () => {
    h.mockResolve.mockResolvedValue(cert());
    await GET(req, ctx(ID));
    expect(h.mockRender).toHaveBeenCalledWith(
      expect.objectContaining({
        values: expect.objectContaining({ name: "Asha Sharma", bh_id: "bh-0123" }),
        verifyUrl: `https://www.butwalhacks.com/verify/${ID}`,
      }),
    );
  });
});
