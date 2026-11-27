import { buildStaticCsp, REPORTING_ENDPOINTS } from "./csp";

/**
 * Response headers for every route, plus the embeddable-widget variant.
 *
 * One definition, two consumers: next.config.ts `headers()` (Vercel) and the
 * `_headers` file of the static marketing site (lib/static-site.ts).
 *
 * Content Security Policy: the static policy covers CDN-cached pages, API
 * routes and files. Dynamically rendered routes (dashboard, portal, claim)
 * get a per-request nonce policy without 'unsafe-inline' from src/proxy.ts,
 * which replaces this header. Both are built in lib/csp.ts — see why static
 * pages keep 'unsafe-inline', the domain audit and the frame-ancestors notes
 * there. Violations are reported to /api/csp-violation.
 */
export type HeaderEntry = { key: string; value: string };

// Transport-level headers for every route. These used to live in vercel.json
// under a /(.*) source, but next.config headers() takes precedence over
// vercel.json for overlapping sources, so that block was shadowed and
// nosniff/referrer-policy never reached production. One owner, one rule.
export const TRANSPORT_HEADERS: HeaderEntry[] = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const PERMISSIONS_POLICY: HeaderEntry = {
  key: "Permissions-Policy",
  value: "camera=(self), microphone=(), geolocation=()",
};

const REPORTING: HeaderEntry = { key: "Reporting-Endpoints", value: REPORTING_ENDPOINTS };

/** Every header for a page; `widget` pages may be framed anywhere. */
export function pageHeaders(widget: boolean): HeaderEntry[] {
  return [
    ...TRANSPORT_HEADERS,
    { key: "Content-Security-Policy", value: buildStaticCsp(widget) },
    PERMISSIONS_POLICY,
    REPORTING,
  ];
}
