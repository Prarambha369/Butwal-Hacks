/** Strip HTML tags, trim whitespace, limit length. */
export function sanitizeString(input: string, maxLength = 5000): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .trim()
    .slice(0, maxLength);
}

/** Validate and sanitize an email address. Returns null if invalid. */
export function sanitizeEmail(input: string): string | null {
  const email = input.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email.slice(0, 254);
}

/** Validate and sanitize a URL. Returns null if invalid. */
export function sanitizeUrl(input: string): string | null {
  try {
    const parsed = new URL(input.startsWith("http") ? input : `https://${input}`);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed.toString().slice(0, 2048);
  } catch {
    return null;
  }
}

// ─── Named wrappers (backward compat) ────────────────────────────────
export const sanitizeName = (s: string) => sanitizeString(s, 100);
export const sanitizeTitle = (s: string) => sanitizeString(s, 200);
export const sanitizeDescription = (s: string) => sanitizeString(s, 2000);
export const sanitizeUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s.trim().toLowerCase()) ? s.trim().toLowerCase() : null;

/** Legacy: validate search input length and allowed chars */
export function validateSearchInput(input: string): { valid: boolean; error?: string } {
  if (input.length > 100) return { valid: false, error: "Search query must be less than 100 characters" };
  if (!/^[a-zA-Z0-9\s\-'_]*$/.test(input)) return { valid: false, error: "Search query contains invalid characters" };
  return { valid: true };
}

/** Legacy: sanitize and truncate search input */
export const sanitizeInput = (s: string) => sanitizeString(s, 100);

// ─── Body size guard ───────────────────────────────────────────────

import { NextResponse } from "next/server";

/**
 * Check the Content-Length header of a request and reject payloads over the limit.
 * Returns a 413 NextResponse if too large, or null if OK.
 *
 * ponytail: does NOT protect against chunked transfer encoding (no content-length header).
 * Vercel's edge infrastructure typically buffers and provides content-length in that case.
 * Upgrade path: read the first chunk of the stream and reject before full parse.
 *
 * Usage (single line):
 *   const oversized = rejectOversized(request); if (oversized) return oversized
 */
export function rejectOversized(
  request: Request,
  maxBytes = 1_048_576 // 1 MB default
): NextResponse | null {
  const rawContentLength = request.headers.get("content-length");
  const contentLength = parseInt(rawContentLength ?? "0", 10);
  if (!isNaN(contentLength) && contentLength > maxBytes) {
    return NextResponse.json(
      { error: "Request body too large" },
      { status: 413 }
    );
  }
  return null;
}
