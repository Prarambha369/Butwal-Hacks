import { notFound } from "next/navigation";

/**
 * Unmatched /dashboard/* paths render their 404 here, inside the
 * force-dynamic dashboard layout, instead of falling through to the
 * prerendered global /_not-found page.
 *
 * Why it matters: /dashboard/* is served with the nonce-based CSP (see
 * src/lib/csp.ts). Prerendered HTML carries no nonce, so the static 404's
 * scripts were blocked and the page stuck on its loading skeleton. Rendering
 * the 404 per request gives it the nonce like every other dashboard page.
 */
export default function DashboardNotFound(): never {
  notFound();
}
