import Link from "next/link";

/**
 * The status notice that sits above every policy page.
 *
 * The documents in `policies/` are drafts written by engineers and have not
 * been through legal review. The site must not present them as settled law:
 * a page that renders a draft without saying so is worse than no page.
 */
export default function PolicyStatusNotice() {
  return (
    <aside
      className="mb-8 rounded-lg border border-primary-red/30 bg-primary-red/5 p-4 text-sm text-secondary"
      aria-label="Policy status"
    >
      <p className="font-semibold text-primary">Draft &mdash; not yet legally reviewed</p>
      <p className="mt-2">
        This document has not been reviewed by an advocate qualified in the laws of
        Nepal, and the review is tracked as an open item. The{" "}
        <Link href="/policies/compliance-gaps" className="text-primary-red underline hover:no-underline">
          compliance gaps
        </Link>{" "}
        list says what still has to be settled before any of it is relied on.
      </p>
    </aside>
  );
}
