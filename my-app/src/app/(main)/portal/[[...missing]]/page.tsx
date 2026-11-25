import { notFound } from "next/navigation";

/**
 * /portal and unmatched /portal/* paths render their 404 here, inside the
 * force-dynamic portal layout, instead of the prerendered global /_not-found
 * page. /portal/* is served with the nonce-based CSP (see src/lib/csp.ts),
 * and prerendered HTML carries no nonce, so the static 404's scripts would be
 * blocked. Optional catch-all because /portal itself has no index page.
 */
export default function PortalNotFound(): never {
  notFound();
}
