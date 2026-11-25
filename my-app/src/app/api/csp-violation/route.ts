import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { shouldLogCspReport, takeCspLogBudget } from "@/lib/csp-report-dedupe";

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
 * fragment, and the /claim/[token] segment is redacted, since page URLs can
 * carry secrets.
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
 *  - Admission limit in place of withRateLimit(): each instance logs at most
 *    LOG_BUDGET_PER_MINUTE reports a minute; the rest still get 204 and are
 *    dropped, so distinct-key floods cannot grow the log volume either.
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
    "document-uri": z.string().nullish(),
    "violated-directive": z.string().nullish(),
    "effective-directive": z.string().nullish(),
    "blocked-uri": z.string().nullish(),
    "source-file": z.string().nullish(),
    "line-number": z.number().nullish(),
    "column-number": z.number().nullish(),
    disposition: z.string().nullish(),
    "script-sample": z.string().nullish(),
  }),
});

const reportingApiSchema = z
  .array(
    z.object({
      type: z.string(),
      url: z.string().nullish(),
      body: z
        .object({
          documentURL: z.string().nullish(),
          blockedURL: z.string().nullish(),
          effectiveDirective: z.string().nullish(),
          disposition: z.string().nullish(),
          sourceFile: z.string().nullish(),
          lineNumber: z.number().nullish(),
          columnNumber: z.number().nullish(),
          sample: z.string().nullish(),
        })
        .nullish(),
    }),
  )
  .max(MAX_REPORTS);

// The CSP spec allows null for sourceFile, lineNumber, sample, etc. (e.g. a
// blocked external resource has no source location), so every field is
// nullish and normalised to undefined before logging.
interface Violation {
  document?: string | null;
  blocked?: string | null;
  directive?: string | null;
  disposition?: string | null;
  source?: string | null;
  line?: number | null;
  sample?: string | null;
}

function truncate(value: string | null | undefined): string | undefined {
  if (value == null) return undefined;
  return value.length > MAX_FIELD ? `${value.slice(0, MAX_FIELD)}…` : value;
}

/** Path segments that are secrets: the claim token in /claim/[token]. */
function redactPath(pathname: string): string {
  return pathname.replace(/^\/claim\/[^/]+/, "/claim/[token]");
}

/**
 * Drop query string and fragment, and redact secret path segments. Values
 * that are not URLs (keywords like "inline" or "eval") pass through.
 */
function stripUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const u = new URL(value);
    return truncate(`${u.origin}${redactPath(u.pathname)}`);
  } catch {
    return truncate(redactPath(value.split(/[?#]/)[0]));
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
      line: v.line ?? undefined,
      sample: truncate(v.sample),
    };
    if (!shouldLogCspReport(`${entry.directive}|${entry.blocked}|${entry.document}`)) continue;
    if (!takeCspLogBudget()) break;
    logger.warn("[csp-violation]", entry);
  }

  return new NextResponse(null, { status: 204 });
}

export const POST = handler;
