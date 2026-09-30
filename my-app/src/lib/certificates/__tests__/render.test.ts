import { describe, expect, it } from "vitest";
import { renderCertificate } from "@/lib/certificates/render";
import { defaultFields, normaliseTemplate } from "@/lib/certificates/template";

/** 1x1 red PNG, so the background path is exercised without a network. */
const TINY_PNG = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  ),
  (c) => c.charCodeAt(0),
);

const noFetch = async () => {
  throw new Error("no network in tests");
};

const template = (over: Record<string, unknown> = {}) =>
  normaliseTemplate({ name: "Test", fields: defaultFields(), ...over });

const VALUES = { name: "Asha Sharma", title: "Certificate of Participation", date: "January 8, 2026" };
const URL = "https://www.butwalhacks.com/verify/8f3e-c21a";

function pdfHeader(bytes: Uint8Array) {
  return String.fromCharCode(...bytes.slice(0, 8));
}

describe("renderCertificate", () => {
  it("produces a real PDF", async () => {
    const { bytes } = await renderCertificate({ template: template(), values: VALUES, verifyUrl: URL });
    expect(bytes.length).toBeGreaterThan(500);
    expect(pdfHeader(bytes)).toBe("%PDF-1.7");
  });

  it("reports the text it drew per token", async () => {
    const { drawn } = await renderCertificate({ template: template(), values: VALUES, verifyUrl: URL });
    expect(drawn.name).toBe("Asha Sharma");
    expect(drawn.date).toBe("January 8, 2026");
  });

  it("renders artwork as a background without complaining", async () => {
    const { warnings } = await renderCertificate({
      template: template({ backgroundUrl: "https://res.cloudinary.com/x/y.png" }),
      values: VALUES,
      verifyUrl: URL,
      fetchImage: async () => TINY_PNG,
    });
    expect(warnings).toEqual([]);
  });

  it("still renders when the background cannot be fetched", async () => {
    // Losing a certificate because Cloudinary had a bad minute is unacceptable.
    const { bytes, warnings } = await renderCertificate({
      template: template({ backgroundUrl: "https://res.cloudinary.com/x/missing.png" }),
      values: VALUES,
      verifyUrl: URL,
      fetchImage: noFetch,
    });
    expect(bytes.length).toBeGreaterThan(500);
    expect(warnings.join(" ")).toMatch(/background could not be drawn/);
  });

  it("embeds a QR pointing at the verification URL", async () => {
    const withQr = await renderCertificate({ template: template(), values: VALUES, verifyUrl: URL });
    const withoutQr = await renderCertificate({
      template: template(),
      values: VALUES,
      verifyUrl: URL,
      includeQr: false,
    });
    expect(withQr.bytes.length).toBeGreaterThan(withoutQr.bytes.length);
  });

  // ── The Devanagari decision ──────────────────────────────────────────────
  it("prints ? and warns rather than emitting mojibake for Devanagari", async () => {
    const { drawn, warnings } = await renderCertificate({
      template: template(),
      values: { ...VALUES, name: "आशा शर्मा" },
      verifyUrl: URL,
    });
    expect(drawn.name).toContain("?");
    expect(drawn.name).not.toContain("श");
    expect(warnings.join(" ")).toMatch(/cannot render/);
    expect(warnings.join(" ")).toContain("आशा शर्मा");
  });

  it("renders Latin-1 accents unchanged", async () => {
    const { drawn, warnings } = await renderCertificate({
      template: template(),
      values: { ...VALUES, name: "Zoë Müller" },
      verifyUrl: URL,
    });
    expect(drawn.name).toBe("Zoë Müller");
    expect(warnings).toEqual([]);
  });

  it("skips and warns about a field with no value", async () => {
    const { drawn, warnings } = await renderCertificate({
      template: template(),
      values: { name: "Asha" },
      verifyUrl: URL,
    });
    expect(drawn.date).toBeUndefined();
    expect(warnings.join(" ")).toMatch(/Issue date.*no value/);
  });

  it("supports a custom token beyond the builtins", async () => {
    const t = normaliseTemplate({
      fields: [{ token: "team", label: "Team", x: 0.5, y: 0.3, fontSize: 0.02 }],
    });
    const { drawn } = await renderCertificate({
      template: t,
      values: { team: "Codebreakers" },
      verifyUrl: URL,
    });
    expect(drawn.team).toBe("Codebreakers");
  });

  it("survives a garbage field list rather than throwing", async () => {
    const { bytes } = await renderCertificate({
      template: normaliseTemplate({ fields: [null, { token: "name" }, "junk"] }),
      values: VALUES,
      verifyUrl: URL,
    });
    expect(bytes.length).toBeGreaterThan(500);
  });

  it("renders at a different page size from the same normalised template", async () => {
    // This is the property that makes coordinates normalised worth it: the
    // same template at A4 and at Letter must both place fields proportionally.
    const a4 = await renderCertificate({
      template: template({ pageWidth: 794, pageHeight: 1123 }),
      values: VALUES,
      verifyUrl: URL,
    });
    const letter = await renderCertificate({
      template: template({ pageWidth: 1056, pageHeight: 816 }),
      values: VALUES,
      verifyUrl: URL,
    });
    expect(a4.bytes.length).toBeGreaterThan(500);
    expect(letter.bytes.length).toBeGreaterThan(500);
  });
});
