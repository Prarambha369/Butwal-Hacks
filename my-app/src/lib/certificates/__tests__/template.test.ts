import { describe, expect, it } from "vitest";
import { StandardFonts } from "pdf-lib";
import {
  standardFontKey,
  BUILTIN_TOKENS,
  defaultFields,
  isLatinEncodable,
  normaliseField,
  normaliseTemplate,
  resolveFieldValue,
} from "@/lib/certificates/template";

describe("isLatinEncodable", () => {
  it("accepts plain Latin and Latin-1 accents", () => {
    expect(isLatinEncodable("Asha Sharma")).toBe(true);
    expect(isLatinEncodable("Zoë Müller-Ñuñez")).toBe(true);
  });

  it("rejects Devanagari, which pdf-lib cannot shape", () => {
    // Not a nit: the standard PDF fonts are WinAnsi, so this would render as
    // mojibake rather than fail. A Nepali-named participant getting a
    // certificate they cannot read is the whole point of getting rejected here.
    expect(isLatinEncodable("शर्मा")).toBe(false);
    expect(isLatinEncodable("Asha शर्मा")).toBe(false);
  });

  it("rejects emoji", () => {
    expect(isLatinEncodable("Priya 🎉")).toBe(false);
  });

  it("rejects the C1 control block, which WinAnsi cannot encode", () => {
    // Asserted the opposite for a while. 32..255 looked like a safe range, but
    // U+007F..U+009F sits inside it and WinAnsi has no glyph for any of it, so
    // a name containing U+0085 made widthOfTextAtSize throw from inside the
    // renderer -- and that call sits outside every try/catch, so the whole
    // certificate 500'd rather than degrading.
    for (const code of [0x7f, 0x85, 0x9f]) {
      expect(isLatinEncodable(String.fromCharCode(code)), `U+00${code.toString(16)}`).toBe(false);
    }
  });

  it("accepts printable ASCII and the Latin-1 supplement", () => {
    expect(isLatinEncodable("Asha Sharma")).toBe(true);
    expect(isLatinEncodable("Zoë Müller")).toBe(true);
    expect(isLatinEncodable("Prize €50")).toBe(true);
  });
});

describe("normaliseField", () => {
  it("clamps coordinates into 0..1", () => {
    const f = normaliseField({ x: 5, y: -3, width: 99 });
    expect(f.x).toBe(1);
    expect(f.y).toBe(0);
    expect(f.width).toBe(1);
  });

  it("treats NaN and non-numbers as the fallback", () => {
    const f = normaliseField({ x: "abc", y: NaN, fontSize: null });
    expect(f.x).toBe(0.5);
    expect(f.y).toBe(0.5);
    expect(f.fontSize).toBeGreaterThan(0);
  });

  it("rejects a malformed colour rather than passing it to the PDF", () => {
    expect(normaliseField({ color: "red" }).color).toBe("#111111");
    expect(normaliseField({ color: "#GGGGGG" }).color).toBe("#111111");
    expect(normaliseField({ color: "#aabbcc" }).color).toBe("#aabbcc");
  });

  it("falls back to a font pdf-lib can actually resolve", () => {
    expect(normaliseField({ fontFamily: "Comic Papyrus" }).fontFamily).toBe("Helvetica");
  });

  it("treats bold and italic as properties, not font names", () => {
    // Previously KNOWN_FONTS contained "Helvetica-Bold", but pdf-lib's
    // StandardFonts keys have no hyphen, so that lookup was undefined and every
    // "bold" field silently printed regular text.
    const bolded = normaliseField({ fontFamily: "Helvetica", bold: true });
    expect(bolded.bold).toBe(true);
    expect(standardFontKey(bolded)).toBe("HelveticaBold");
    expect(standardFontKey(normaliseField({ fontFamily: "Times-Roman", bold: true }))).toBe(
      "TimesRomanBold",
    );
    expect(standardFontKey(normaliseField({ fontFamily: "Courier", italic: true }))).toBe(
      "CourierOblique",
    );
    expect(standardFontKey(normaliseField({ fontFamily: "Courier", bold: true, italic: true }))).toBe(
      "CourierBoldOblique",
    );
    // No style flags means the plain family key, which exists.
    expect(standardFontKey(normaliseField({ fontFamily: "Times-Roman" }))).toBe("TimesRoman");
  });

  it("resolves every family x bold x italic combination to a key pdf-lib has", () => {
    // The real guarantee. An earlier version hardcoded "Oblique" as the italic
    // suffix for all families, but Times uses "Italic" -- so Times + Italic
    // produced "TimesRomanOblique", which does not exist, and render.ts
    // swallows the undefined with a Helvetica fallback. An author who chose
    // Times + Italic got sans-serif and no warning.
    const real = new Set(Object.keys(StandardFonts));
    const families = ["Helvetica", "Times-Roman", "Courier"];
    const missing: string[] = [];

    for (const family of families) {
      for (const bold of [false, true]) {
        for (const italic of [false, true]) {
          const key = standardFontKey(normaliseField({ fontFamily: family, bold, italic }));
          if (!real.has(key)) missing.push(`${family} b=${bold} i=${italic} -> ${key}`);
        }
      }
    }

    expect(missing).toEqual([]);
    // Spot-check the two that were wrong.
    expect(standardFontKey(normaliseField({ fontFamily: "Times-Roman", italic: true }))).toBe(
      "TimesRomanItalic",
    );
    expect(
      standardFontKey(normaliseField({ fontFamily: "Times-Roman", bold: true, italic: true })),
    ).toBe("TimesRomanBoldItalic");
    expect(standardFontKey(normaliseField({ fontFamily: "Courier", italic: true }))).toBe(
      "CourierOblique",
    );
  });

  it("normalises align to one of the three values", () => {
    expect(normaliseField({ align: "justify" }).align).toBe("center");
    expect(normaliseField({ align: "right" }).align).toBe("right");
  });

  it("generates an id when one is missing", () => {
    expect(normaliseField({}, 3).id).toBe("f_3");
    expect(normaliseField({ id: "keep-me" }).id).toBe("keep-me");
  });

  it("leaves width undefined so text can be measured", () => {
    expect(normaliseField({}).width).toBeUndefined();
  });
});

describe("defaultFields", () => {
  it("includes the fields a certificate cannot omit", () => {
    const tokens = defaultFields().map((f) => f.token);
    expect(tokens).toEqual(expect.arrayContaining(["name", "title", "date"]));
  });

  it("has unique ids", () => {
    const ids = defaultFields().map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("bolds the recipient name via bold, not a bogus font family", () => {
    const name = defaultFields().find((f) => f.token === "name");
    expect(name).toBeDefined();
    // BOLD_FONT is "Helvetica-Bold", which is not a pdf-lib font key, so
    // normaliseField coerced it back to Helvetica and dropped the emphasis: the
    // recipient name printed in the regular face on every default template.
    // The editor's Font <select> also matched none of its own options.
    expect(name?.bold).toBe(true);
    expect(name?.fontFamily).toBe("Helvetica");
    expect(name?.fontFamily).not.toContain("-");
  });

  it("only names font families the renderer can embed", () => {
    for (const field of defaultFields()) {
      expect(["Helvetica", "Times-Roman", "Courier"]).toContain(field.fontFamily);
    }
  });

  it("only uses known tokens", () => {
    for (const f of defaultFields()) {
      expect(BUILTIN_TOKENS).toContain(f.token as never);
    }
  });
});

describe("normaliseTemplate", () => {
  it("falls back to defaults when fields is not an array", () => {
    const t = normaliseTemplate({ fields: "nope" });
    expect(t.fields).toHaveLength(3);
  });

  it("clamps page dimensions into a renderable range", () => {
    expect(normaliseTemplate({ pageWidth: 10 }).pageWidth).toBe(200);
    expect(normaliseTemplate({ pageHeight: 99999 }).pageHeight).toBe(5000);
  });

  it("reports whether there is artwork to draw", () => {
    expect(normaliseTemplate({ backgroundUrl: "https://x/y.png" }).hasBackground).toBe(true);
    expect(normaliseTemplate({ backgroundUrl: "" }).hasBackground).toBe(false);
    expect(normaliseTemplate({}).hasBackground).toBe(false);
  });

  it("keeps the good fields when one is malformed", () => {
    // Refusing to render a certificate is worse than rendering nine of ten
    // fields, so a bad field degrades to defaults instead of throwing.
    const t = normaliseTemplate({ fields: [{ token: "name" }, null, { token: "date" }] });
    expect(t.fields).toHaveLength(3);
    expect(t.fields.every((f) => f.token.length > 0)).toBe(true);
  });

  it("defaults a blank name", () => {
    expect(normaliseTemplate({ name: "  " }).name).toBe("Untitled template");
  });
});

describe("resolveFieldValue", () => {
  const field = { token: "name" } as never;

  it("returns the bound value trimmed", () => {
    expect(resolveFieldValue(field, { name: "  Asha  " })).toBe("Asha");
  });

  it("returns empty string for an unresolvable token", () => {
    expect(resolveFieldValue(field, {})).toBe("");
  });

  it("resolves a custom token", () => {
    const custom = { token: "team" } as never;
    expect(resolveFieldValue(custom, { team: "Codebreakers" })).toBe("Codebreakers");
  });
});
