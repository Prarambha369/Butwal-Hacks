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

  // ── Degradation, not a crash ─────────────────────────────────────────────
  it("replaces C1 control characters instead of throwing from inside pdf-lib", async () => {
    // profiles.full_name comes from the user-controlled Auth0 `name` claim, and
    // U+0085 previously made widthOfTextAtSize throw from a call site with no
    // try/catch around it -- a 500 on the certificate, not a "?" on the name.
    for (const code of [0x7f, 0x85, 0x9f]) {
      const { bytes, drawn } = await renderCertificate({
        template: template(),
        values: { ...VALUES, name: `Ram${String.fromCharCode(code)} Bahadur` },
        verifyUrl: URL,
      });
      expect(bytes.length, `U+00${code.toString(16)}`).toBeGreaterThan(500);
      expect(drawn.name).not.toContain(String.fromCharCode(code));
    }
  });

  it("changes the output when bold is toggled on an otherwise identical field", async () => {
    // Only meaningful because both renders use the SAME single field with the
    // same text, so the only variable is the bold flag. (The earlier version of
    // this test compared a 3-field render with a 1-field one, which would have
    // differed in length even if bold were a no-op.)
    //
    // The exhaustive check that every family x bold x italic combination
    // resolves to a key pdf-lib actually has lives in template.test.ts, because
    // font programs are named inside compressed object streams that a
    // byte-level assertion here cannot see.
    // Explicit, because defaultFields()[0] is itself bold now -- spreading it
    // and only setting `bold: true` for one arm would compare bold to bold.
    const oneField = (bold: boolean) =>
      normaliseTemplate({
        fields: [
          {
            ...defaultFields()[0],
            token: "name",
            label: "Name",
            bold: bold ? true : undefined,
          },
        ],
      });

    const regular = await renderCertificate({
      template: oneField(false),
      values: { name: "Asha Sharma" },
      verifyUrl: URL,
    });
    const bold = await renderCertificate({
      template: oneField(true),
      values: { name: "Asha Sharma" },
      verifyUrl: URL,
    });

    expect(bold.bytes.length).not.toBe(regular.bytes.length);
  });

  it("keeps the QR on the page for a narrow template", async () => {
    // page_width has a 200px floor, and pageW - side - 28 went negative there,
    // clipping the QR off the left edge.
    const { bytes, warnings } = await renderCertificate({
      template: template({ pageWidth: 200, pageHeight: 200 }),
      values: VALUES,
      verifyUrl: URL,
    });
    expect(bytes.length).toBeGreaterThan(500);
    expect(warnings.join(" ")).not.toMatch(/off the page|negative/i);
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
