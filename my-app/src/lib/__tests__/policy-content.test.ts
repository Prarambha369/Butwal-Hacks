import { describe, it, expect } from "vitest";

import { loadPolicy, prepareSource, resolvePolicyHref } from "@/lib/policy-content";
import { POLICY_NAV, PUBLISHED_POLICIES, REPO_URL } from "@/lib/policy-registry";

/**
 * Link resolution and source preparation for the policy markdown.
 */
describe("resolvePolicyHref", () => {
  it("maps a relative link to a published policy onto its site page", () => {
    expect(resolvePolicyHref("PRIVACY_POLICY.md", "policies/HACKATHON_RULES.md")).toBe(
      "/policies/privacy",
    );
  });

  it("keeps the fragment on a published policy link", () => {
    expect(resolvePolicyHref("PRIVACY_POLICY.md#retention", "policies/HACKATHON_RULES.md")).toBe(
      "/policies/privacy#retention",
    );
  });

  it("never links an unpublished policy's own page", () => {
    expect(resolvePolicyHref("COMPLIANCE_GAPS.md", "policies/PRIVACY_POLICY.md")).toBe("/policies");
    expect(resolvePolicyHref("TERMS_OF_SERVICE.md", "policies/PRIVACY_POLICY.md")).toBe(
      "/legal/terms",
    );
  });

  it("resolves the Code of Conduct from its old root path and from .github/", () => {
    expect(resolvePolicyHref("../CODE_OF_CONDUCT.md", "policies/HACKATHON_RULES.md")).toBe(
      "/policies/code-of-conduct",
    );
    expect(
      resolvePolicyHref("policies/CHEATING_RESPONSE.md", ".github/CODE_OF_CONDUCT.md"),
    ).toBe("/policies/cheating-response");
  });

  it("keeps the fragment on a repository fallback link", () => {
    expect(resolvePolicyHref("../docs/ARCHITECTURE.md#adrs", "policies/README.md")).toBe(
      `${REPO_URL}/blob/main/docs/ARCHITECTURE.md#adrs`,
    );
  });

  it("passes in-page anchors, mail links, and absolute URLs through untouched", () => {
    expect(resolvePolicyHref("#scope", "policies/README.md")).toBe("#scope");
    expect(resolvePolicyHref("mailto:legal@butwalhacks.com", "policies/README.md")).toBe(
      "mailto:legal@butwalhacks.com",
    );
    expect(resolvePolicyHref("https://example.com/x", "policies/README.md")).toBe(
      "https://example.com/x",
    );
  });
});

describe("prepareSource", () => {
  const from = "policies/PRIVACY_POLICY.md";

  it("replaces a file-name link text with the document title", () => {
    expect(prepareSource("See [HACKATHON_RULES.md](HACKATHON_RULES.md).", from)).toBe(
      "See [Hackathon Rules](HACKATHON_RULES.md).",
    );
  });

  it("keeps authored link text", () => {
    expect(prepareSource("See [the rules](HACKATHON_RULES.md).", from)).toBe(
      "See [the rules](HACKATHON_RULES.md).",
    );
  });

  it("turns a prose link to an unpublished policy into plain text", () => {
    expect(prepareSource("Tracked in [COMPLIANCE_GAPS.md](COMPLIANCE_GAPS.md).", from)).toBe(
      "Tracked in Compliance Gaps.",
    );
  });

  it("points terms and cookie links at their summary pages", () => {
    expect(prepareSource("[COOKIE_POLICY.md](COOKIE_POLICY.md)", from)).toBe(
      "[Cookie Policy](/cookie-policy)",
    );
  });

  it("drops a list item that only points at an unpublished policy", () => {
    const src = "- [HACKATHON_RULES.md](HACKATHON_RULES.md) — rules\n- [LEGAL_ENTITY.md](LEGAL_ENTITY.md) — internal";
    expect(prepareSource(src, from)).toBe("- [Hackathon Rules](HACKATHON_RULES.md) — rules");
  });

  it("names non-policy repository files readably", () => {
    expect(prepareSource("[../SECURITY.md](../SECURITY.md)", from)).toBe(
      "[Security Policy](../SECURITY.md)",
    );
  });
});

describe("published policy set", () => {
  it("loads every published policy from disk", () => {
    for (const policy of PUBLISHED_POLICIES) {
      expect(loadPolicy(policy.slug), policy.slug).not.toBeNull();
    }
  });

  it("does not show a raw .md file name or link an unpublished page in any published policy", () => {
    const unpublishedHrefs = new Set(
      ["terms", "cookies", "acceptable-use", "participant-and-guardian-terms", "safeguarding",
        "incident-response", "disciplinary-action", "community-values", "data-subject-rights",
        "legal-entity", "compliance-gaps"].map((slug) => `/policies/${slug}`),
    );
    for (const policy of PUBLISHED_POLICIES) {
      const text = JSON.stringify(loadPolicy(policy.slug)?.blocks);
      expect(text, policy.slug).not.toMatch(/\[[\w./-]+\.md\]/);
      for (const href of unpublishedHrefs) expect(text, policy.slug).not.toContain(`(${href}`);
    }
  });

  it("navigates only to the index and published policies", () => {
    expect(POLICY_NAV.map((l) => l.href)).toEqual([
      "/policies",
      ...PUBLISHED_POLICIES.map((p) => `/policies/${p.slug}`),
    ]);
  });
});
