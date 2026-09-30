import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Regression tests for the security review findings on the certificate flow.
 *
 * Every test here corresponds to a specific defect that shipped in the first
 * draft of this feature and was found by review, not by me. They are written
 * so that reintroducing the bug fails the test rather than passing quietly.
 */

// ── F1: reads must not be server-action endpoints ────────────────────────────
describe("template reads are not remotely callable", () => {
  it("does not export resolveTemplateForEvent from the 'use server' file", async () => {
    // A "use server" module turns every export into an endpoint. The first
    // draft exported a helper there that checked no session at all.
    const mod = await import("@/lib/actions/certificates");
    expect(Object.keys(mod)).not.toContain("resolveTemplateForEvent");
  });

  it("keeps the helper in a plain module instead", async () => {
    const mod = await import("@/lib/certificates/templates");
    expect(typeof mod.resolveTemplateForEvent).toBe("function");
  });

  it("rejects a non-UUID event id instead of interpolating it into a filter", async () => {
    const { resolveTemplateForEvent } = await import("@/lib/certificates/templates");
    // Filter injection via .or() grammar; returning null short-circuits it.
    const from = await import("@/utils/supabase");
    const spy = vi.spyOn(from, "createServiceClient");
    const result = await resolveTemplateForEvent("event_id.is.null,id.neq.x");
    expect(result).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });
});

// ── F8: SSRF and memory exhaustion via backgroundUrl ─────────────────────────
describe("background image fetch is constrained", () => {
  const realFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = realFetch;
  });

  const renderWith = async (backgroundUrl: string) => {
    const { renderCertificate } = await import("@/lib/certificates/render");
    const { normaliseTemplate } = await import("@/lib/certificates/template");
    return renderCertificate({
      template: normaliseTemplate({ backgroundUrl }),
      values: { name: "Asha Sharma" },
      verifyUrl: "https://www.butwalhacks.com/verify/1",
    });
  };

  it("refuses plain http", async () => {
    globalThis.fetch = vi.fn() as never;
    const { warnings } = await renderWith("http://res.cloudinary.com/x/y.png");
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(warnings.join(" ")).toMatch(/https/);
  });

  it("refuses a host that is not the upload host", async () => {
    // The cloud metadata endpoint is the reason this allow-list exists.
    for (const url of [
      "https://169.254.169.254/latest/meta-data/",
      "https://localhost:3000/api/secret",
      "https://evil.example/x.png",
      "https://notres.cloudinary.com.attacker.example/x.png",
    ]) {
      globalThis.fetch = vi.fn() as never;
      const { warnings } = await renderWith(url);
      expect(globalThis.fetch, url).not.toHaveBeenCalled();
      expect(warnings.join(" "), url).toMatch(/host not allowed/);
    }
  });

  it("refuses to follow a redirect off the allowed host", async () => {
    const fetchMock = vi.fn(async (_url: unknown, _init?: unknown) => new Response("x", { status: 302 }));
    globalThis.fetch = fetchMock as never;
    const { warnings } = await renderWith("https://res.cloudinary.com/x/y.png");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ redirect: "error" });
    // A redirect surfaces as a warning, not a crash.
    expect(warnings.join(" ")).toMatch(/background could not be drawn/);
  });

  it("refuses a body larger than the cap", async () => {
    const big = "x".repeat(9 * 1024 * 1024);
    const fetchMock = vi.fn(
      async () => new Response(big, { status: 200, headers: { "content-length": String(big.length) } }),
    );
    globalThis.fetch = fetchMock as never;
    const { warnings } = await renderWith("https://res.cloudinary.com/x/y.png");
    expect(warnings.join(" ")).toMatch(/background could not be drawn/);
  });

  it("still accepts a small real image from the allowed host", async () => {
    const png = Uint8Array.from(
      atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="),
      (c) => c.charCodeAt(0),
    );
    globalThis.fetch = vi.fn(async () => new Response(png, { status: 200 })) as never;
    const { bytes, warnings } = await renderWith("https://res.cloudinary.com/x/y.png");
    // The allow-list must not have blocked the host it is meant to permit.
    expect(warnings.join(" ")).not.toMatch(/background could not be drawn/);
    expect(bytes.length).toBeGreaterThan(500);
  });
});

// ── F9: closeEvent after bulk issuance ───────────────────────────────────────
describe("closeEvent tolerates certificates that already exist", () => {
  it("issues with ignoreDuplicates so a pre-issued certificate is a no-op", async () => {
    // The first draft used .insert() + `throw certError`. Combined with the
    // new UNIQUE (event_id, profile_id) that made an event with any
    // bulk-issued certificate permanently impossible to close.
    const { readFileSync } = await import("node:fs");
    const src = readFileSync("src/lib/actions/events.ts", "utf8");
    const closeIdx = src.indexOf("Issue certificates for attended participants");
    const block = src.slice(closeIdx, closeIdx + 900);
    expect(block).toMatch(/ignoreDuplicates/);
    expect(block).not.toMatch(/\.insert\(certificates\)/);
  });
});
