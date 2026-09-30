import { describe, expect, it } from "vitest";
import {
  BOLD_FONT,
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

  it("tolerates control characters", () => {
    expect(isLatinEncodable("a\tb\nc")).toBe(true);
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
    expect(normaliseField({ fontFamily: BOLD_FONT }).fontFamily).toBe(BOLD_FONT);
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
