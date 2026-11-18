import { describe, it, expect } from "vitest";

import { resolvePolicyHref } from "@/lib/policy-content";
import { REPO_URL } from "@/lib/policy-registry";

/**
 * Link resolution for the canonical policy markdown. The regression this
 * guards: a link with a `#fragment` was normalized as part of the path, so
 * `PRIVACY_POLICY.md#retention` matched no policy and fell through to a
 * GitHub URL instead of the site page.
 */
describe("resolvePolicyHref", () => {
  it("maps a relative policy link to its site page", () => {
    expect(resolvePolicyHref("PRIVACY_POLICY.md", "policies/COOKIE_POLICY.md")).toBe(
      "/policies/privacy",
    );
  });

  it("keeps the fragment on a policy link", () => {
    expect(resolvePolicyHref("PRIVACY_POLICY.md#retention", "policies/COOKIE_POLICY.md")).toBe(
      "/policies/privacy#retention",
    );
  });

  it("keeps the fragment on a repository fallback link", () => {
    expect(resolvePolicyHref("../docs/ARCHITECTURE.md#adrs", "policies/README.md")).toBe(
      `${REPO_URL}/blob/main/docs/ARCHITECTURE.md#adrs`,
    );
  });

  it("passes in-page anchors and absolute URLs through untouched", () => {
    expect(resolvePolicyHref("#scope", "policies/README.md")).toBe("#scope");
    expect(resolvePolicyHref("https://example.com/x", "policies/README.md")).toBe(
      "https://example.com/x",
    );
  });
});
