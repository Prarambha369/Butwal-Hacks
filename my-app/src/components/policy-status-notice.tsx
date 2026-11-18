/**
 * The status notice that sits above every policy page.
 *
 * The documents in `policies/` are drafts and have not been through legal
 * review. The site must not present them as settled law: a page that renders
 * a draft without saying so is worse than no page.
 */
export default function PolicyStatusNotice() {
  return (
    <aside
      className="mb-8 rounded-lg border border-primary-red/30 bg-primary-red/5 p-4 text-sm text-secondary"
      aria-label="Policy status"
    >
      <p className="font-semibold text-primary">Draft &mdash; under legal review</p>
      <p className="mt-2">
        These policies are being reviewed with our legal advisor and may change before they are
        final.
      </p>
    </aside>
  );
}
