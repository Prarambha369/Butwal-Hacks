/**
 * Certificate template model.
 *
 * Pure types plus the coercion/validation that decides whether a stored
 * `fields` jsonb blob is safe to render. No React, no database, no PDF library
 * — so every rule here is unit-testable on its own and the renderer can trust
 * whatever comes out of `normaliseTemplate`.
 *
 * The central decision: **coordinates are normalised 0..1 of the page**, never
 * pixels. An organiser authors against a 1056x816 editor canvas; the same
 * template then renders at A4, US Letter, or whatever page size the PDF needs
 * without re-positioning a single field. Storing pixels would silently break
 * every template the first time the page size changed.
 */

/** Values a field can be bound to. Anything else is a custom literal. */
export const BUILTIN_TOKENS = ["name", "title", "date", "email", "bh_id"] as const;
export type BuiltinToken = (typeof BUILTIN_TOKENS)[number];

export type FieldAlign = "left" | "center" | "right";

export interface TemplateField {
  id: string;
  /** Builtin token, or a custom key resolved by the caller. */
  token: string;
  /** Shown in the editor. Also the fallback when a token resolves to nothing. */
  label: string;
  /** 0..1 of page width. */
  x: number;
  /** 0..1 of page height. */
  y: number;
  /** 0..1 of page width. Undefined means "measure the text". */
  width?: number;
  /** Relative to page width, so it scales with the page. */
  fontSize: number;
  fontFamily: string;
  /** `#rrggbb`. */
  color: string;
  align: FieldAlign;
  /** Degrees, clockwise. */
  rotation: number;
  bold?: boolean;
  italic?: boolean;
}

export interface CertificateTemplate {
  id: string;
  eventId: string | null;
  name: string;
  backgroundUrl: string | null;
  pageWidth: number;
  pageHeight: number;
  fields: TemplateField[];
  isDefault: boolean;
}

export const DEFAULT_FONT = "Helvetica";
export const BOLD_FONT = "Helvetica-Bold";

/** A blank template carries exactly the fields a certificate cannot omit. */
export function defaultFields(): TemplateField[] {
  return [
    {
      id: "f_name",
      token: "name",
      label: "Recipient name",
      x: 0.5,
      y: 0.42,
      width: 0.7,
      fontSize: 0.042,
      fontFamily: BOLD_FONT,
      color: "#111111",
      align: "center",
      rotation: 0,
    },
    {
      id: "f_title",
      token: "title",
      label: "Achievement title",
      x: 0.5,
      y: 0.56,
      width: 0.6,
      fontSize: 0.022,
      fontFamily: DEFAULT_FONT,
      color: "#333333",
      align: "center",
      rotation: 0,
    },
    {
      id: "f_date",
      token: "date",
      label: "Issue date",
      x: 0.5,
      y: 0.78,
      width: 0.3,
      fontSize: 0.018,
      fontFamily: DEFAULT_FONT,
      color: "#555555",
      align: "center",
      rotation: 0,
    },
  ];
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function num(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

const HEX = /^#[0-9a-f]{6}$/i;

/** Font families pdf-lib can actually resolve. Anything else renders blank. */
const KNOWN_FONTS = new Set(["Helvetica", "Helvetica-Bold", "Helvetica-Oblique", "Times-Roman", "Courier"]);

/**
 * pdf-lib's standard fonts are WinAnsi-encoded: Latin-1 only. Devanagari
 * needs OpenType shaping (conjuncts, matra reordering) that pdf-lib does not
 * implement, so a Nepali name would render as garbage rather than fail loudly.
 * This helper exists so the renderer can substitute a transliteration and
 * report the substitution instead of shipping mojibake.
 */
export function isLatinEncodable(text: string): boolean {
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    // Control chars, then anything above U+00FF.
    if (code < 32) continue;
    if (code > 255) return false;
  }
  return true;
}

export function normaliseField(raw: unknown, index = 0): TemplateField {
  const o = (raw ?? {}) as Record<string, unknown>;
  const align = o.align;
  const fontFamily = typeof o.fontFamily === "string" ? o.fontFamily : DEFAULT_FONT;

  return {
    id: typeof o.id === "string" && o.id ? o.id : `f_${index}`,
    token: typeof o.token === "string" && o.token ? o.token : "name",
    label: typeof o.label === "string" && o.label ? o.label : "Field",
    x: clamp01(num(o.x, 0.5)),
    y: clamp01(num(o.y, 0.5)),
    width: o.width === undefined || o.width === null ? undefined : clamp01(num(o.width, 0.5)),
    // Relative to page width: 0.042 renders as ~4.2% of the page across.
    fontSize: Math.max(0.004, num(o.fontSize, 0.02)),
    fontFamily: KNOWN_FONTS.has(fontFamily) ? fontFamily : DEFAULT_FONT,
    color: typeof o.color === "string" && HEX.test(o.color) ? o.color : "#111111",
    align: align === "left" || align === "right" ? align : "center",
    rotation: num(o.rotation, 0),
    bold: o.bold === true || undefined,
    italic: o.italic === true || undefined,
  };
}

export interface NormalisedTemplate extends CertificateTemplate {
  /** True when the template has artwork to draw behind the fields. */
  hasBackground: boolean;
  /** Fields that pdf-lib's standard fonts can actually render. */
  latinSafeFields: TemplateField[];
  /** Fields bound to a token with no value for a given recipient. */
  unresolvableFields: TemplateField[];
}

/**
 * Coerce a database row (or an editor payload) into something the renderer can
 * trust. Deliberately forgiving: a template with one malformed field still
 * renders the other nine, because refusing to render a certificate is worse
 * than rendering it slightly wrong.
 */
export function normaliseTemplate(raw: Record<string, unknown>): NormalisedTemplate {
  const fields = Array.isArray(raw.fields) ? raw.fields.map(normaliseField) : defaultFields();
  const pageWidth = Math.min(5000, Math.max(200, num(raw.pageWidth, 1056)));
  const pageHeight = Math.min(5000, Math.max(200, num(raw.pageHeight, 816)));

  return {
    id: typeof raw.id === "string" ? raw.id : "",
    eventId: typeof raw.eventId === "string" ? raw.eventId : null,
    name: typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : "Untitled template",
    backgroundUrl: typeof raw.backgroundUrl === "string" && raw.backgroundUrl ? raw.backgroundUrl : null,
    pageWidth,
    pageHeight,
    fields,
    isDefault: raw.isDefault === true,
    hasBackground: typeof raw.backgroundUrl === "string" && raw.backgroundUrl.length > 0,
    latinSafeFields: fields,
    unresolvableFields: [],
  };
}

/** Resolve a field's text for one recipient. Returns "" when unresolvable. */
export function resolveFieldValue(
  field: TemplateField,
  values: Partial<Record<BuiltinToken, string>> & Record<string, string | undefined>,
): string {
  const v = values[field.token];
  return typeof v === "string" ? v.trim() : "";
}
