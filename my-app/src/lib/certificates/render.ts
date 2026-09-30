import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import {
  isLatinEncodable,
  normaliseTemplate,
  resolveFieldValue,
  type CertificateTemplate,
  type NormalisedTemplate,
  type TemplateField,
} from "./template";

/**
 * Template-aware certificate PDF renderer.
 *
 * This replaces nothing -- `lib/pdf/certificate-export.ts` still generates the
 * original text-only certificate, and nothing calls this yet. It exists because
 * that generator cannot draw artwork (it emits no image XObject at all) and
 * cannot place text, so "bring your own template" was impossible.
 *
 * Coordinates: templates store 0..1 of the page, so the same template renders
 * at any page size. The conversion to PDF points is the only place pixels
 * exist, and it happens once, here.
 *
 * Fonts: pdf-lib's standard fonts are WinAnsi (Latin-1). pdf-lib does not
 * implement OpenType shaping, so Devanagari cannot be rendered correctly by
 * any configuration of this code. Rather than emit mojibake we replace
 * unmappable characters with "?" and return a warning naming the field, so the
 * organiser sees the problem instead of shipping a certificate nobody can read.
 */

const PX_TO_PT = 72 / 96;

export type RenderValues = Record<string, string | undefined>;

export type RenderResult = {
  bytes: Uint8Array;
  /** Human-readable problems: non-Latin text, unresolvable fields, image failures. */
  warnings: string[];
  /** Field token -> the text actually drawn, for the delivery log. */
  drawn: Record<string, string>;
};

export type RenderOptions = {
  template: CertificateTemplate | NormalisedTemplate | Record<string, unknown>;
  values: RenderValues;
  /** Absolute https URL of the verification page, printed as a QR. */
  verifyUrl: string;
  /** Fetch the background artwork. Injectable so tests need no network. */
  fetchImage?: (url: string) => Promise<Uint8Array>;
  /** Optional per-field overrides, e.g. a QR placed by the caller. */
  includeQr?: boolean;
};

/** Replace characters the standard fonts cannot encode. */
function sanitiseForStandardFonts(text: string): { text: string; replaced: boolean } {
  if (isLatinEncodable(text)) return { text, replaced: false };
  let replaced = false;
  let out = "";
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    if (code < 32 || code > 255) {
      out += "?";
      replaced = true;
    } else {
      out += ch;
    }
  }
  return { text: out, replaced };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16) / 255,
    g: parseInt(clean.slice(2, 4), 16) / 255,
    b: parseInt(clean.slice(4, 6), 16) / 255,
  };
}

async function defaultFetchImage(url: string): Promise<Uint8Array> {
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`image fetch failed: ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

/** pdf-lib picks the embedder by format, so sniff the magic bytes. */
function looksLikeJpeg(bytes: Uint8Array): boolean {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

export async function renderCertificate(options: RenderOptions): Promise<RenderResult> {
  const {
    template,
    values,
    verifyUrl,
    fetchImage = defaultFetchImage,
    includeQr = true,
  } = options;

  const warnings: string[] = [];
  const drawn: Record<string, string> = {};

  const tpl: NormalisedTemplate =
    "fields" in template && "hasBackground" in template
      ? (template as NormalisedTemplate)
      : normaliseTemplate(template as Record<string, unknown>);

  const doc = await PDFDocument.create();
  // TrimBox of 0 removes the default 1/2-inch margin some viewers add.
  doc.setTitle(`${tpl.name} certificate`);
  doc.setProducer("Butwal Hacks");
  doc.setCreator("Butwal Hacks certificate renderer");

  const pageW = tpl.pageWidth * PX_TO_PT;
  const pageH = tpl.pageHeight * PX_TO_PT;
  const page: PDFPage = doc.addPage([pageW, pageH]);

  // ── Background artwork ───────────────────────────────────────────────────
  if (tpl.hasBackground && tpl.backgroundUrl) {
    try {
      const bytes = await fetchImage(tpl.backgroundUrl);
      const image = looksLikeJpeg(bytes)
        ? await doc.embedJpg(bytes)
        : await doc.embedPng(bytes);
      page.drawImage(image, { x: 0, y: 0, width: pageW, height: pageH });
    } catch (err) {
      // A missing background must not lose the certificate; the fields still
      // render on white, which is legible.
      warnings.push(
        `background could not be drawn (${err instanceof Error ? err.message : "unknown error"}); rendered without artwork`,
      );
    }
  }

  // ── Fonts ────────────────────────────────────────────────────────────────
  const fonts = new Map<string, PDFFont>();
  const fontFor = async (field: TemplateField): Promise<PDFFont> => {
    const key = field.bold ? `${field.fontFamily}-bold` : field.fontFamily;
    const cached = fonts.get(key);
    if (cached) return cached;
    const font = await doc.embedFont(StandardFonts[field.fontFamily as never] ?? StandardFonts.Helvetica);
    fonts.set(key, font);
    return font;
  };

  // ── Text fields ──────────────────────────────────────────────────────────
  for (const field of tpl.fields) {
    const raw = resolveFieldValue(field, values);
    if (!raw) {
      warnings.push(`field "${field.label}" has no value and was skipped`);
      continue;
    }
    const { text, replaced } = sanitiseForStandardFonts(raw);
    if (replaced) {
      warnings.push(
        `field "${field.label}" contains characters the PDF fonts cannot render (for example "${raw}") and was printed with "?" in their place`,
      );
    }

    const font = await fontFor(field);
    const fontSize = Math.max(4, field.fontSize * tpl.pageWidth * PX_TO_PT);
    const { r, g, b } = hexToRgb(field.color);
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    const maxWidth = field.width ? field.width * pageW : pageW;
    // Shrink rather than overflow: a long name must stay inside its box.
    const usedSize = textWidth > maxWidth && textWidth > 0 ? fontSize * (maxWidth / textWidth) : fontSize;
    const usedWidth = font.widthOfTextAtSize(text, usedSize);

    const boxCentreX = field.x * pageW;
    const leftX =
      field.align === "center"
        ? boxCentreX - usedWidth / 2
        : field.align === "right"
          ? boxCentreX - usedWidth
          : boxCentreX;

    // Templates are authored top-left like a canvas; PDF's origin is bottom-left.
    const topY = field.y * pageH;
    const baselineY = pageH - topY - usedSize;

    page.drawText(text, {
      x: Math.max(0, leftX),
      y: Math.max(0, baselineY),
      size: usedSize,
      font,
      color: rgb(r, g, b),
      rotate: degrees(field.rotation || 0),
    });

    drawn[field.token] = text;
  }

  // ── QR to the live verification page ─────────────────────────────────────
  if (includeQr && verifyUrl) {
    try {
      const png = await QRCode.toBuffer(verifyUrl, { type: "png", margin: 1, width: 256 });
      const qr = await doc.embedPng(new Uint8Array(png));
      const side = Math.min(90, pageH * 0.16);
      page.drawImage(qr, {
        x: pageW - side - 28,
        y: 28,
        width: side,
        height: side,
      });
    } catch (err) {
      warnings.push(`QR code could not be generated (${err instanceof Error ? err.message : "unknown error"})`);
    }
  }

  const bytes = await doc.save();
  return { bytes, warnings, drawn };
}
