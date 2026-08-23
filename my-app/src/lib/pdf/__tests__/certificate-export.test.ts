import { describe, it, expect } from "vitest";
import { generateCertificatesPdf } from "@/lib/pdf/certificate-export";
import type { CertificateData, EventInfo } from "@/lib/pdf/certificate-export";

// ── Test fixtures ──────────────────────────────────────────────────

const SAMPLE_EVENT: EventInfo = {
  title: "Butwal Hacks 2026",
  startDate: "2026-07-15T00:00:00Z",
  endDate: "2026-07-16T00:00:00Z",
  location: "Butwal, Nepal",
};

const SAMPLE_EVENT_NO_LOCATION: EventInfo = {
  title: "Butwal Hacks 2026",
  startDate: "2026-07-15T00:00:00Z",
  endDate: "2026-07-16T00:00:00Z",
};

const SAMPLE_CERT: CertificateData = {
  attendeeName: "Alice Gurung",
  bhId: "BH-26-042",
  eventTitle: "Butwal Hacks 2026",
  eventDate: "July 15, 2026",
  issueDate: "July 16, 2026",
  certificateId: "cert-abc-123",
};

const SAMPLE_CERT_2: CertificateData = {
  attendeeName: "Bob Sharma",
  bhId: "BH-26-043",
  eventTitle: "Butwal Hacks 2026",
  eventDate: "July 15, 2026",
  issueDate: "July 16, 2026",
};

// Helper: decode Uint8Array to string for assertions
function pdfToString(bytes: Uint8Array): string {
  return new TextDecoder("utf-8").decode(bytes);
}

// ─────────────────────────────────────────────────────────────────────
// generateCertificatesPdf
// ─────────────────────────────────────────────────────────────────────
describe("generateCertificatesPdf", () => {
  describe("PDF structure", () => {
    it("produces a valid PDF header", async () => {
      const pdf = await generateCertificatesPdf([SAMPLE_CERT], SAMPLE_EVENT);
      const text = pdfToString(pdf);
      expect(text.startsWith("%PDF-1.4")).toBe(true);
    });

    it("ends with the PDF end-of-file marker", async () => {
      const pdf = await generateCertificatesPdf([SAMPLE_CERT], SAMPLE_EVENT);
      const text = pdfToString(pdf);
      expect(text.endsWith("%%EOF")).toBe(true);
    });

    it("contains a cross-reference table with 'xref' and 'trailer'", async () => {
      const pdf = await generateCertificatesPdf([SAMPLE_CERT], SAMPLE_EVENT);
      const text = pdfToString(pdf);
      expect(text).toContain("xref");
      expect(text).toContain("trailer");
    });

    it("contains 'startxref' pointing to the xref table offset", async () => {
      const pdf = await generateCertificatesPdf([SAMPLE_CERT], SAMPLE_EVENT);
      const text = pdfToString(pdf);
      expect(text).toMatch(/startxref\n\d+\n%%EOF$/);
    });

    it("references the Catalog root object in the trailer", async () => {
      const pdf = await generateCertificatesPdf([SAMPLE_CERT], SAMPLE_EVENT);
      const text = pdfToString(pdf);
      expect(text).toMatch(/\/Root \d+ 0 R/);
    });

    it("contains a Pages tree with /Type /Pages and /Kids array", async () => {
      const pdf = await generateCertificatesPdf([SAMPLE_CERT], SAMPLE_EVENT);
      const text = pdfToString(pdf);
      expect(text).toContain("/Type /Pages");
      expect(text).toContain("/Kids [");
      expect(text).toContain("/Count");
    });
  });

  describe("page content", () => {
    it("includes the attendee name in the content stream", async () => {
      const pdf = await generateCertificatesPdf([SAMPLE_CERT], SAMPLE_EVENT);
      const text = pdfToString(pdf);
      // The name is rendered in uppercase in the PDF stream
      expect(text).toContain("ALICE GURUNG");
    });

    it("includes the BH-ID in Courier font in the content stream", async () => {
      const pdf = await generateCertificatesPdf([SAMPLE_CERT], SAMPLE_EVENT);
      const text = pdfToString(pdf);
      // BH-ID rendered with the Courier font resource "Co"
      expect(text).toContain("/Co");
      expect(text).toContain("BH-26-042");
    });

    it("includes the event title in uppercase in the content stream", async () => {
      const pdf = await generateCertificatesPdf([SAMPLE_CERT], SAMPLE_EVENT);
      const text = pdfToString(pdf);
      expect(text).toContain("BUTWAL HACKS 2026");
    });

    it("includes 'CERTIFICATE OF ACHIEVEMENT' title", async () => {
      const pdf = await generateCertificatesPdf([SAMPLE_CERT], SAMPLE_EVENT);
      const text = pdfToString(pdf);
      expect(text).toContain("CERTIFICATE OF ACHIEVEMENT");
    });

    it("includes the issued date and verification footer", async () => {
      const pdf = await generateCertificatesPdf([SAMPLE_CERT], SAMPLE_EVENT);
      const text = pdfToString(pdf);
      expect(text).toContain("Issue date:");
      expect(text).toContain("butwalhacks.com/verify");
    });

    it("includes the certificate ID in the footer when provided", async () => {
      const pdf = await generateCertificatesPdf([SAMPLE_CERT], SAMPLE_EVENT);
      const text = pdfToString(pdf);
      expect(text).toContain("ID: cert-abc-123");
    });

    it("falls back to BH-ID in footer when certificateId is not provided", async () => {
      const pdf = await generateCertificatesPdf([SAMPLE_CERT_2], SAMPLE_EVENT);
      const text = pdfToString(pdf);
      expect(text).toContain("ID: BH-26-043");
    });

    it("includes the event location when provided", async () => {
      const pdf = await generateCertificatesPdf([SAMPLE_CERT], SAMPLE_EVENT);
      const text = pdfToString(pdf);
      expect(text).toContain("Location:");
      expect(text).toContain("Butwal, Nepal");
    });

    it("omits location section when location is not provided", async () => {
      const pdf = await generateCertificatesPdf(
        [SAMPLE_CERT],
        SAMPLE_EVENT_NO_LOCATION,
      );
      const text = pdfToString(pdf);
      expect(text).not.toContain("Location:");
    });

    it("renders the 'BUTWAL HACKS' header on each page", async () => {
      const pdf = await generateCertificatesPdf([SAMPLE_CERT], SAMPLE_EVENT);
      const text = pdfToString(pdf);
      expect(text).toContain("BUTWAL HACKS");
    });

    it("includes the subtitle text", async () => {
      const pdf = await generateCertificatesPdf([SAMPLE_CERT], SAMPLE_EVENT);
      const text = pdfToString(pdf);
      expect(text).toContain("This certificate is proudly presented to");
    });

    it("includes the description text", async () => {
      const pdf = await generateCertificatesPdf([SAMPLE_CERT], SAMPLE_EVENT);
      const text = pdfToString(pdf);
      expect(text).toContain("For active participation and contribution to the hackathon.");
    });
  });

  describe("multi-page", () => {
    it("generates one page per certificate", async () => {
      const pdf = await generateCertificatesPdf(
        [SAMPLE_CERT, SAMPLE_CERT_2],
        SAMPLE_EVENT,
      );
      const text = pdfToString(pdf);

      // Pages tree should have Count = 2
      expect(text).toContain("/Count 2");

      // Both attendee names should appear
      expect(text).toContain("ALICE GURUNG");
      expect(text).toContain("BOB SHARMA");

      // Both BH-IDs should appear
      expect(text).toContain("BH-26-042");
      expect(text).toContain("BH-26-043");
    });

    it("includes two page objects in the Kids array", async () => {
      const pdf = await generateCertificatesPdf(
        [SAMPLE_CERT, SAMPLE_CERT_2],
        SAMPLE_EVENT,
      );
      const text = pdfToString(pdf);

      // Two pages means two "N 0 R" references in the Kids array
      const kidsMatch = text.match(/\/Kids \[(.*?)\]/);
      expect(kidsMatch).not.toBeNull();
      const refs = kidsMatch![1].trim().split(/\s+/);
      // Each reference is 3 tokens: N, 0, R. 2 refs = 6 tokens.
      expect(refs.length).toBe(6);
      expect(refs.filter((r) => r === "R").length).toBe(2);
    });

    it("each page has the standard US Letter MediaBox", async () => {
      const pdf = await generateCertificatesPdf(
        [SAMPLE_CERT, SAMPLE_CERT_2],
        SAMPLE_EVENT,
      );
      const text = pdfToString(pdf);

      // MediaBox [0 0 612 792] should appear for each page
      const mediaBoxMatches = text.match(/MediaBox \[0 0 612 792\]/g);
      expect(mediaBoxMatches).toHaveLength(2);
    });
  });

  describe("edge cases", () => {
    it("handles special characters in attendee name (parentheses, backslashes)", async () => {
      const specialCert: CertificateData = {
        ...SAMPLE_CERT,
        attendeeName: "Jane (Doe) \\ Smith",
      };
      const pdf = await generateCertificatesPdf([specialCert], SAMPLE_EVENT);
      const text = pdfToString(pdf);

      // Name content appears in the stream (pdfEscape handles escaping)
      expect(text).toContain("JANE");
      expect(text).toContain("DOE");
      expect(text).toContain("SMITH");
    });

    it("handles empty certificate array with default pages catalog", async () => {
      const pdf = await generateCertificatesPdf([], SAMPLE_EVENT);
      const text = pdfToString(pdf);

      expect(text.startsWith("%PDF-1.4")).toBe(true);
      expect(text).toContain("/Count 0");
    });

    it("handles attendee name with special characters", async () => {
      const specialCert: CertificateData = {
        ...SAMPLE_CERT,
        attendeeName: "Sneha's \"Team\"",
      };
      const pdf = await generateCertificatesPdf([specialCert], SAMPLE_EVENT);
      const text = pdfToString(pdf);

      // The PDF should contain the name (rendered in uppercase)
      expect(text).toContain("SNEHA");
    });

    it("generates deterministic output for same inputs", async () => {
      const pdf1 = await generateCertificatesPdf([SAMPLE_CERT], SAMPLE_EVENT);
      const pdf2 = await generateCertificatesPdf([SAMPLE_CERT], SAMPLE_EVENT);
      expect(pdf1).toEqual(pdf2);
    });
  });

  describe("font resources", () => {
    it("references Helvetica, Helvetica-Bold, Helvetica-Oblique, Courier fonts", async () => {
      const pdf = await generateCertificatesPdf([SAMPLE_CERT], SAMPLE_EVENT);
      const text = pdfToString(pdf);

      expect(text).toContain("/Helvetica");
      expect(text).toContain("/Helvetica-Bold");
      expect(text).toContain("/Helvetica-Oblique");
      expect(text).toContain("/Courier");
    });

    it("uses font resource keys Hv, Hb, Ho, Co in page resources", async () => {
      const pdf = await generateCertificatesPdf([SAMPLE_CERT], SAMPLE_EVENT);
      const text = pdfToString(pdf);

      expect(text).toContain("/Hv");
      expect(text).toContain("/Hb");
      expect(text).toContain("/Ho");
      expect(text).toContain("/Co");
    });
  });
});
