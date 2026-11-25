import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { shouldLogCspReport } from "@/lib/csp-report-dedupe";

/**
 * POST /api/csp-violation
 *
 * Receives Content-Security-Policy violation reports from browsers. The CSP
 * names this route in both `report-uri` (legacy, `application/csp-report`)
 * and `report-to` via `Reporting-Endpoints` (Reporting API,
 * `application/reports+json`) — see src/lib/csp.ts.
 *
 * No auth: browsers send these without credentials, from any page. So the
 * route trusts nothing: the body is capped at MAX_BODY_BYTES (counted while
 * reading, not taken from Content-Length), parsed through Zod, and only a few
 * truncated fields are logged. URLs are logged without query string or
 * fragment, since page URLs can carry tokens (e.g. /claim/[token]?...).
 *
 * Free-plan budget (Vercel Hobby, Upstash, Sentry free tiers):
 *  - No Upstash call. Report volume is unbounded and attacker-controlled, so
 *    `withRateLimit()` would spend one Redis command per report. This is a
 *    deliberate exception to the "mutations use withRateLimit" rule: the route
 *    writes nothing but a log line, and duplicates are dropped in memory.
 *  - No Sentry. Logged at warn, which is console-only (logger.error forwards
 *    to Sentry); extension-injected scripts alone produce a steady stream.
 *  - Deduplicated per function instance: the same (directive, blocked URL,
 *    page path) is logged once per DEDUPE_WINDOW_MS, then dropped. The map is
 *    bounded at DEDUPE_MAX_KEYS.
 *  - Node.js runtime (the default; Edge is deprecated on Vercel). The handler
 *    does no I/O beyond reading the capped body, so CPU time is negligible.
 *
 * Answers 204 for a well-formed report.
 */

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 10 * 1024;
const MAX_REPORTS = 20;
const MAX_FIELD = 300;

const legacySchema = z.object({
  "csp-report": z.object({
    "document-uri": z.string().optional(),
    "violated-directive": z.string().optional(),
    "effective-directive": z.string().optional(),
    "blocked-uri": z.string().optional(),
    "source-file": z.string().optional(),
    "line-number": z.number().optional(),
    "column-number": z.number().optional(),
    disposition: z.string().optional(),
    "script-sample": z.string().optional(),
  }),
});

const reportingApiSchema = z
  .array(
    z.object({
      type: z.string(),
      url: z.string().optional(),
      body: z
        .object({
          documentURL: z.string().optional(),
          blockedURL: z.string().optional(),
          effectiveDirective: z.string().optional(),
          disposition: z.string().optional(),
          sourceFile: z.string().optional(),
          lineNumber: z.number().optional(),
          columnNumber: z.number().optional(),
          sample: z.string().optional(),
        })
        .optional(),
    }),
  )
  .max(MAX_REPORTS);

interface Violation {
  document?: string;
  blocked?: string;
  directive?: string;
  disposition?: string;
  source?: string;
  line?: number;
  sample?: string;
}

function truncate(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  return value.length > MAX_FIELD ? `${value.slice(0, MAX_FIELD)}…` : value;
}

/** Drop query string and fragment; keep keywords like "inline" or "eval". */
function stripUrl(value: string | undefined): string | undefined {
  if (!value) return value;
  try {
    const u = new URL(value);
    return truncate(`${u.origin}${u.pathname}`);
  } catch {
    return truncate(value.split(/[?#]/)[0]);
  }
}

class BodyTooLargeError extends Error {}

/** Read the body as text, aborting as soon as it exceeds `max` bytes. */
async function readCapped(request: NextRequest, max: number): Promise<string> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > max) throw new BodyTooLargeError();
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel();
      throw new BodyTooLargeError();
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}

function parseViolations(contentType: string, payload: unknown): Violation[] | null {
  if (contentType === "application/reports+json") {
    const parsed = reportingApiSchema.safeParse(payload);
    if (!parsed.success) return null;
    return parsed.data
      .filter((r) => r.type === "csp-violation" && r.body)
      .map((r) => ({
        document: r.body?.documentURL ?? r.url,
        blocked: r.body?.blockedURL,
        directive: r.body?.effectiveDirective,
        disposition: r.body?.disposition,
        source: r.body?.sourceFile,
        line: r.body?.lineNumber,
        sample: r.body?.sample,
      }));
  }

  const parsed = legacySchema.safeParse(payload);
  if (!parsed.success) return null;
  const r = parsed.data["csp-report"];
  return [
    {
      document: r["document-uri"],
      blocked: r["blocked-uri"],
      directive: r["effective-directive"] ?? r["violated-directive"],
      disposition: r.disposition,
      source: r["source-file"],
      line: r["line-number"],
      sample: r["script-sample"],
    },
  ];
}

const ACCEPTED_TYPES = new Set([
  "application/csp-report",
  "application/reports+json",
  // Some browsers send the legacy shape as plain JSON.
  "application/json",
]);

async function handler(request: NextRequest): Promise<NextResponse> {
  const contentType = (request.headers.get("content-type") ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (!ACCEPTED_TYPES.has(contentType)) {
    return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
  }

  let text: string;
  try {
    text = await readCapped(request, MAX_BODY_BYTES);
  } catch (err) {
    if (err instanceof BodyTooLargeError) {
      return NextResponse.json({ error: "Report too large" }, { status: 413 });
    }
    return NextResponse.json({ error: "Could not read report" }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  }

  const violations = parseViolations(contentType, payload);
  if (!violations) {
    return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  }

  for (const v of violations) {
    const entry = {
      document: stripUrl(v.document),
      blocked: stripUrl(v.blocked),
      directive: truncate(v.directive),
      disposition: truncate(v.disposition),
      source: stripUrl(v.source),
      line: v.line,
      sample: truncate(v.sample),
    };
    if (!shouldLogCspReport(`${entry.directive}|${entry.blocked}|${entry.document}`)) continue;
    logger.warn("[csp-violation]", entry);
  }

  return new NextResponse(null, { status: 204 });
}

export const POST = handler;
