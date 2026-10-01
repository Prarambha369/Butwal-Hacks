import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import {
  isLatinEncodable,
  isWinAnsi,
  standardFontKey,
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

  /**
   * Replace characters the standard fonts cannot encode.
   *
   * Uses isWinAnsi rather than a 32..255 range test. Letting the C1 block
   * through moved the failure from "prints ?" to "throws from inside pdf-lib",
   * because the text-measurement call is not inside a try/catch.
   */
  function sanitiseForStandardFonts(text: string): {
    text: string;
    replaced: boolean;
    replacedCount: number;
  } {
    if (isLatinEncodable(text)) return { text, replaced: false, replacedCount: 0 };
    let replacedCount = 0;
    let out = "";
    for (const ch of text) {
      if (isWinAnsi(ch.codePointAt(0)!)) {
        out += ch;
      } else {
        out += "?";
        replacedCount++;
      }
    }
    return { text: out, replaced: replacedCount > 0, replacedCount };
  }

/**
 * Bound an organizer-supplied template field label before it is interpolated
 * into a warning that reaches the log. The label is free text on the template,
 * so without this an organizer could put newlines and arbitrary content into
 * log records. Not recipient data, but log records should not be forgeable.
 */
function safeLabel(label: string): string {
  // Flatten control characters, then drop quotes. A double quote is escaped
  // for PDF syntax, but WinAnsi cannot encode it and pdf-lib then refuses the
  // whole font -- so a single quote in an organiser-controlled field label
  // would fail the render. Labels are boilerplate, so dropping the character
  // is a smaller loss than failing the certificate.
  const flat = label.replace(/[\r\n\t]+/g, " ").replace(/["“”]/g, "").trim();
  return flat.length > 60 ? `${flat.slice(0, 60)}...` : flat;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16) / 255,
    g: parseInt(clean.slice(2, 4), 16) / 255,
    b: parseInt(clean.slice(4, 6), 16) / 255,
  };
}

  /** Artwork is a Cloudinary asset; nothing else is a legitimate source. */
  const ALLOWED_IMAGE_HOSTS = new Set(["res.cloudinary.com"]);

  /** A certificate background is a background, not a payload. */
  const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

  /**
   * Fetch certificate artwork under constraints.
   *
   * The background URL is organizer-supplied and gets fetched from the
   * *unauthenticated* PDF route, so an unconstrained fetch was both SSRF and a
   * memory-exhaustion amplifier: point it at a fast multi-gigabyte stream and
   * anyone can OOM the function by requesting a certificate. The write needed
   * `organizer`; the amplification did not.
   *
   * Constrained to https, to the upload host, with redirects refused rather
   * than followed -- a 302 to 169.254.169.254 is the entire attack -- and with
   * a hard byte ceiling. `arrayBuffer()` on an unbounded body is the specific
   * call that had to go.
   */
  async function defaultFetchImage(url: string): Promise<Uint8Array> {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error("background url is not a valid URL");
    }

    if (parsed.protocol !== "https:") {
      throw new Error("background url must be https");
    }
    if (!ALLOWED_IMAGE_HOSTS.has(parsed.hostname)) {
      throw new Error(`background host not allowed: ${parsed.hostname}`);
    }

    const res = await fetch(parsed, {
      signal: AbortSignal.timeout(10_000),
      redirect: "error",
    });
    if (!res.ok) throw new Error(`image fetch failed: ${res.status}`);

    const declared = Number(res.headers.get("content-length") ?? "0");
    if (declared > MAX_IMAGE_BYTES) {
      throw new Error("background image is too large");
    }

    // Enforce the ceiling on the read itself, not just the header: a lying or
    // absent content-length is the normal case for a chunked response.
    const reader = res.body?.getReader();
    if (!reader) throw new Error("background response had no body");

    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > MAX_IMAGE_BYTES) {
        await reader.cancel();
        throw new Error("background image is too large");
      }
      chunks.push(value);
    }

    const out = new Uint8Array(total);
    let at = 0;
    for (const chunk of chunks) {
      out.set(chunk, at);
      at += chunk.byteLength;
    }
    return out;
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
  // The 1/2-inch viewer margin is NOT removed. This comment used to claim a
  // TrimBox did that, but no TrimBox is ever set -- and the QR below is drawn
  // inside the margin it claimed to have eliminated.
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
    // standardFontKey resolves family + bold + italic to a key that actually
    // exists in StandardFonts. The previous lookup used field.fontFamily
    // directly, so a "Helvetica-Bold" family name resolved to undefined and
    // every bold field printed regular text with no warning.
    const key = standardFontKey(field);
    const cached = fonts.get(key);
    if (cached) return cached;
    const font = await doc.embedFont(
      StandardFonts[key as keyof typeof StandardFonts] ?? StandardFonts.Helvetica,
    );
    fonts.set(key, font);
    return font;
  };

  // ── Text fields ──────────────────────────────────────────────────────────
  for (const field of tpl.fields) {
    const raw = resolveFieldValue(field, values);
    if (!raw) {
      warnings.push(`field "${safeLabel(field.label)}" has no value and was skipped`);
      continue;
    }
const { text, replaced, replacedCount } = sanitiseForStandardFonts(raw);
      if (replaced) {
        // The count, never the value. This warning reaches
        // logger.warn("certificate.pdf.warnings") on the UNAUTHENTICATED PDF
        // route, and the value is the recipient's own field content -- their
        // full name, in the case that actually fires. Devanagari is not
        // WinAnsi-encodable, so every Nepali-named participant trips this, and
        // the certificate id sits in the same log record, so it is directly
        // re-identifying. A count is enough to diagnose a font problem; the
        // text is not needed and does not belong in a log.
        warnings.push(
          `field "${safeLabel(field.label)}" contains ${replacedCount} character(s) the PDF fonts cannot render, printed with "?" in their place`,
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
        // Clamped: page_width has a 200px floor, and at that size
      // `pageW - side - 28` goes negative and clips the QR off the left edge.
      x: Math.max(0, pageW - side - 28),
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
