/**
 * Native PDF generator for certificate/credential export.
 *
 * Generates a multi-page PDF with one certificate per page using raw PDF format.
 * No external dependencies — uses standard Helvetica (Type 1) font built into
 * every PDF viewer.
 *
 * The layout mimics a formal certificate: border frame, credential title, event
 * name in large bold text, recipient name, BH-ID, issue date, and a verification
 * footer with the Butwal Hacks public profile URL.
 */

// PDF utilities — these produce valid PDF syntax strings

function pdfEscape(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\n/g, "\\n");
}

function _rgbStroke(r: number, g: number, b: number): string {
  return `${(r / 255).toFixed(4)} ${(g / 255).toFixed(4)} ${(b / 255).toFixed(4)} RG`;
}

// ── Font definitions ──────────────────────────────────────────────
// Uses the 14 standard Type 1 fonts that all PDF readers support.

const FONTS = {
  Helvetica: "Helvetica",
  HelveticaBold: "Helvetica-Bold",
  HelveticaOblique: "Helvetica-Oblique",
  Courier: "Courier",
} as const;

// ── Page constants ────────────────────────────────────────────────

const PAGE_W = 612; // US Letter width  (72 dpi × 8.5")
const PAGE_H = 792; // US Letter height (72 dpi × 11")
const MARGIN = 54;  // 0.75 inch margins

// ── Certificate layout ───────────────────────────────────────────

export interface CertificateData {
  attendeeName: string
  bhId: string
  eventTitle: string
  eventDate: string
  issueDate: string
  certificateId?: string
}

export interface EventInfo {
  title: string
  startDate: string
  endDate: string
  location?: string | null
}

/**
 * Build a complete PDF buffer for a set of certificates.
 * Each certificate gets its own page.
 */
export async function generateCertificatesPdf(
  certificates: CertificateData[],
  event: EventInfo,
): Promise<Uint8Array> {
  // We build the PDF using object-number references.
  // Every PDF object gets a sequential number.
  let objNum = 0;
  const objects: string[] = [];

  function nextObj(): number {
    return ++objNum;
  }

  function addObj(content: string): number {
    const id = nextObj();
    objects.push(`${id} 0 obj\n${content}\nendobj`);
    return id;
  }

  // ── Catalog ──
  const pagesObjId = addObj(""); // placeholder, filled after pages
  const catalogId = addObj(`<< /Type /Catalog /Pages ${pagesObjId} 0 R >>`);

  // ── Font resources ──
  const fontHelvId = addObj(`<< /Type /Font /Subtype /Type1 /BaseFont /${FONTS.Helvetica} >>`);
  const fontHelvBoldId = addObj(`<< /Type /Font /Subtype /Type1 /BaseFont /${FONTS.HelveticaBold} >>`);
  const fontHelvOblId = addObj(`<< /Type /Font /Subtype /Type1 /BaseFont /${FONTS.HelveticaOblique} >>`);
  const fontCourId = addObj(`<< /Type /Font /Subtype /Type1 /BaseFont /${FONTS.Courier} >>`);

  // ── Page content ──
  const pageObjIds: number[] = [];
  const contentObjIds: number[] = [];

  for (const cert of certificates) {
    const content = buildCertificatePageContent(cert, event, fontHelvId, fontHelvBoldId, fontHelvOblId, fontCourId);
    const contentId = addObj(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    contentObjIds.push(contentId);

    const pageId = addObj(
      `<< /Type /Page /Parent ${pagesObjId} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Contents ${contentId} 0 R /Resources << /Font << /Hv ${fontHelvId} 0 R /Hb ${fontHelvBoldId} 0 R /Ho ${fontHelvOblId} 0 R /Co ${fontCourId} 0 R >> >> >>`,
    );
    pageObjIds.push(pageId);
  }

  // ── Pages tree ──
  const pageRefs = pageObjIds.map((id) => `${id} 0 R`).join(" ");
  const pagesContent = `<< /Type /Pages /Kids [${pageRefs}] /Count ${pageObjIds.length} >>`;
  objects[pagesObjId - 1] = `${pagesObjId} 0 obj\n${pagesContent}\nendobj`;

  // ── Assemble ──
  // Compute byte offsets for each object for the xref table
  const offsets: number[] = [];
  let pos = 0;
  for (const obj of objects) {
    offsets.push(pos);
    pos += obj.length + 1; // +1 for newline
  }

  const body = objects.join("\n");
  let xref = `xref\n0 ${objNum + 1}\n0000000000 65535 f \n`;
  for (let i = 0; i < offsets.length; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size ${objNum + 1} /Root ${catalogId} 0 R >>\nstartxref\n${pos}\n%%EOF`;
  const pdf = `%PDF-1.4\n%\xFF\xFF\xFF\xFF\n${body}\n${xref}${trailer}`;

  return new TextEncoder().encode(pdf);
}

/**
 * Build the content stream for a single certificate page.
 * Draws a border frame, header, credential details, and footer.
 */
function buildCertificatePageContent(
  cert: CertificateData,
  event: EventInfo,
  fontHv: number,
  fontHb: number,
  fontHo: number,
  fontCo: number,
): string {
  const lines: string[] = [];

  function t(font: number, size: number, x: number, y: number, text: string, color?: string) {
    lines.push(`BT /${font === fontHv ? "Hv" : font === fontHb ? "Hb" : font === fontHo ? "Ho" : "Co"} ${size} Tf ${color ?? "0 0 0 rg"} ${x.toFixed(0)} ${y.toFixed(0)} Td (${pdfEscape(text)}) Tj ET`);
  }

  function line(x1: number, y1: number, x2: number, y2: number, color?: string) {
    lines.push(`${color ?? "0.8 0.8 0.8 RG"} ${x1.toFixed(0)} ${y1.toFixed(0)} m ${x2.toFixed(0)} ${y2.toFixed(0)} l S`);
  }

  // ── Border frame ──
  const borderColor = _rgbStroke(190, 190, 190);
  const innerBorder = _rgbStroke(220, 220, 220);
  lines.push(`${borderColor} 2 w`);
  lines.push(`${MARGIN - 8} ${MARGIN - 8} m ${PAGE_W - MARGIN + 8} ${MARGIN - 8} l ${PAGE_W - MARGIN + 8} ${PAGE_H - MARGIN + 8} l ${MARGIN - 8} ${PAGE_H - MARGIN + 8} l s`);
  lines.push(`${innerBorder} 0.5 w`);
  lines.push(`${MARGIN - 4} ${MARGIN - 4} m ${PAGE_W - MARGIN + 4} ${MARGIN - 4} l ${PAGE_W - MARGIN + 4} ${PAGE_H - MARGIN + 4} l ${MARGIN - 4} ${PAGE_H - MARGIN + 4} l s`);

  // ── Header: "BUTWAL HACKS" top-left ──
  t(fontHb, 10, MARGIN, PAGE_H - MARGIN - 12, "BUTWAL HACKS", "0.90 0 0 rg");

  // ── Divider line ──
  line(MARGIN, PAGE_H - MARGIN - 22, PAGE_W - MARGIN, PAGE_H - MARGIN - 22);

  // ── Title ──
  const centerX = PAGE_W / 2;
  t(fontHb, 28, centerX - 70, PAGE_H - MARGIN - 70, "CERTIFICATE OF ACHIEVEMENT", "0.15 0.15 0.15 rg");

  // ── Decorative line ──
  line(centerX - 80, PAGE_H - MARGIN - 85, centerX + 80, PAGE_H - MARGIN - 85, "0.90 0 0 rg");
  lines.push("0.90 0 0 RG 2 w");
  line(centerX - 80, PAGE_H - MARGIN - 85, centerX + 80, PAGE_H - MARGIN - 85);
  lines.push("0 0 0 RG 0.5 w");

  // ── Event name ──
  t(fontHb, 18, centerX - 100, PAGE_H - MARGIN - 120, cert.eventTitle.toUpperCase(), "0.15 0.15 0.15 rg");

  // ── Subtitle ──
  t(fontHo, 11, centerX - 80, PAGE_H - MARGIN - 145, "This certificate is proudly presented to", "0.4 0.4 0.4 rg");

  // ── Attendee name ──
  t(fontHb, 26, centerX - 100, PAGE_H - MARGIN - 190, cert.attendeeName.toUpperCase(), "0 0 0 rg");

  // ── BH-ID ──
  t(fontCo, 10, centerX - 60, PAGE_H - MARGIN - 215, `${cert.bhId}`, "0.5 0.5 0.5 rg");

  // ── Description ──
  t(fontHv, 11, centerX - 130, PAGE_H - MARGIN - 250,
    "For active participation and contribution to the hackathon.", "0.3 0.3 0.3 rg");

  // ── Event details ──
  const detailsY = PAGE_H - MARGIN - 300;
  t(fontHb, 10, centerX - 120, detailsY, "Event:", "0.4 0.4 0.4 rg");
  t(fontHv, 10, centerX - 80, detailsY, cert.eventTitle, "0.2 0.2 0.2 rg");

  t(fontHb, 10, centerX - 120, detailsY - 18, "Date:", "0.4 0.4 0.4 rg");
  const eventDateStr = cert.eventDate;
  t(fontHv, 10, centerX - 80, detailsY - 18, eventDateStr, "0.2 0.2 0.2 rg");

  if (event.location) {
    t(fontHb, 10, centerX - 120, detailsY - 36, "Location:", "0.4 0.4 0.4 rg");
    t(fontHv, 10, centerX - 80, detailsY - 36, event.location, "0.2 0.2 0.2 rg");
  }

  // ── Divider ──
  lines.push("0.85 0.85 0.85 RG 0.5 w");
  line(MARGIN, MARGIN + 50, PAGE_W - MARGIN, MARGIN + 50);

  // ── Footer ──
  t(fontHo, 8, MARGIN, MARGIN + 30, "Issued by Butwal Hacks — butwalhacks.com", "0.5 0.5 0.5 rg");
  t(fontHo, 8, MARGIN, MARGIN + 18, `Issue date: ${cert.issueDate}`, "0.5 0.5 0.5 rg");
  t(fontHo, 8, PAGE_W - MARGIN - 140, MARGIN + 30, "Verify at butwalhacks.com/verify", "0.5 0.5 0.5 rg");
  t(fontCo, 7, PAGE_W - MARGIN - 140, MARGIN + 10, `ID: ${cert.certificateId ?? cert.bhId}`, "0.6 0.6 0.6 rg");

  return lines.join("\n");
}
