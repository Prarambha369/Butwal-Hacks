/**
 * Policy registry — the single list of Butwal Hacks policies.
 *
 * Every policy lives as canonical markdown in the repository (see `policies/`
 * and `CODE_OF_CONDUCT.md` at the root). This module is the map from a URL
 * slug to that file, plus the nav used across the policy pages. It contains no
 * file I/O so it can be imported from anywhere, including client components.
 *
 * The documents in `policies/` are the governing set: drafts pending legal
 * review, tracked as such in `policies/COMPLIANCE_GAPS.md`. The pages at
 * `/legal/privacy`, `/legal/terms`, and `/cookie-policy` are public-facing
 * summaries of three of them, and they are not the canonical text.
 *
 * Only documents marked `published` are shown on the site. The others are
 * under review with our legal advisor; see `PolicyMeta.published`.
 *
 * Reading the files themselves lives in `policy-content.ts`, which is
 * server-only.
 */

/**
 * The version string written onto a registration when consent is captured.
 *
 * Bump it whenever the consent text in `policies/REGISTRATION_NOTICES.md`
 * changes, so that a registration always says which wording the person
 * agreed to.
 */
export const POLICY_VERSION = "2026-11-18";

/** Human-readable form of the version above, shown on the policy pages. */
export const POLICY_LAST_UPDATED = "November 18, 2026";

/**
 * Format a policy's own version for display.
 *
 * Each document carries its own `Policy version:` line, and a document that
 * was amended shows its own date rather than the date of the last change
 * somewhere else.
 */
export function formatPolicyDate(value: string | null | undefined): string {
  const raw = (value ?? "").trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return raw || POLICY_LAST_UPDATED;

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const month = months[Number(match[2]) - 1];
  if (!month) return raw;

  return `${month} ${Number(match[3])}, ${match[1]}`;
}

export type PolicySlug =
  | "code-of-conduct"
  | "terms"
  | "privacy"
  | "cookies"
  | "acceptable-use"
  | "participant-and-guardian-terms"
  | "safeguarding"
  | "hackathon-rules"
  | "registration-notices"
  | "cheating-response"
  | "incident-response"
  | "disciplinary-action"
  | "community-values"
  | "data-subject-rights"
  | "legal-entity"
  | "compliance-gaps";

export interface PolicyMeta {
  slug: PolicySlug;
  title: string;
  summary: string;
  /** Canonical markdown file, relative to the repository root. */
  file: string;
  /**
   * Whether the site shows this document. Only the documents participants are
   * asked to accept or read during registration and submission are published.
   * The rest are under review with our legal advisor and are not shown; their
   * URLs redirect to the policy index (or to `redirectTo`) until they are.
   */
  published: boolean;
  /** Where an unpublished policy's URL sends people instead of the index. */
  redirectTo?: string;
}

export const POLICIES: PolicyMeta[] = [
  {
    slug: "code-of-conduct",
    title: "Code of Conduct",
    summary:
      "The behaviour standard for every Butwal Hacks space, and how to report a violation.",
    // Moved under .github/ on main (#58); the old root path 404'd this page.
    file: ".github/CODE_OF_CONDUCT.md",
    published: true,
  },
  {
    slug: "terms",
    title: "Terms of Service",
    summary:
      "The contract of use: what you may do here, who owns what, and how it ends.",
    file: "policies/TERMS_OF_SERVICE.md",
    published: false,
    redirectTo: "/legal/terms",
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    summary:
      "What we collect, why, who sees it, and the rights you have over it.",
    file: "policies/PRIVACY_POLICY.md",
    published: true,
  },
  {
    slug: "cookies",
    title: "Cookie Policy",
    summary: "Which cookies and local storage we set, and how to refuse them.",
    file: "policies/COOKIE_POLICY.md",
    published: false,
    redirectTo: "/cookie-policy",
  },
  {
    slug: "acceptable-use",
    title: "Acceptable Use Policy",
    summary: "What use of the platform is tolerated, and what is not.",
    file: "policies/ACCEPTABLE_USE_POLICY.md",
    published: false,
  },
  {
    slug: "participant-and-guardian-terms",
    title: "Participant and Guardian Terms",
    summary:
      "What a participant under 18 agrees to, and what their guardian consents to.",
    file: "policies/PARTICIPANT_AND_GUARDIAN_TERMS.md",
    published: false,
  },
  {
    slug: "safeguarding",
    title: "Safeguarding Policy",
    summary:
      "Our commitments to participants under 18, and the staff boundaries that go with them.",
    file: "policies/SAFEGUARDING_POLICY.md",
    published: false,
  },
  {
    slug: "hackathon-rules",
    title: "Hackathon Rules",
    summary:
      "The rules of an event: what you may build, what you must disclose, and the grounds for disqualification.",
    file: "policies/HACKATHON_RULES.md",
    published: true,
  },
  {
    slug: "registration-notices",
    title: "Registration Notices",
    summary:
      "The exact consent text captured at registration and project submission, and what is recorded.",
    file: "policies/REGISTRATION_NOTICES.md",
    published: true,
  },
  {
    slug: "cheating-response",
    title: "Cheating Response",
    summary:
      "What happens when a project is suspected of not having been built during the event.",
    file: "policies/CHEATING_RESPONSE.md",
    published: true,
  },
  {
    slug: "incident-response",
    title: "Incident Response",
    summary:
      "The step-by-step procedure followed after a code of conduct report is filed.",
    file: "policies/INCIDENT_RESPONSE.md",
    published: false,
  },
  {
    slug: "disciplinary-action",
    title: "Disciplinary Action",
    summary:
      "The ladder of sanctions, how they are notified, and how they can be appealed.",
    file: "policies/DISCIPLINARY_ACTION.md",
    published: false,
  },
  {
    slug: "community-values",
    title: "Community Values",
    summary: "What we hold ourselves to when we run an event.",
    file: "policies/COMMUNITY_VALUES.md",
    published: false,
  },
  {
    slug: "data-subject-rights",
    title: "Data Subject Rights",
    summary: "How to exercise your rights, and the deadlines we work to.",
    file: "policies/DATA_SUBJECT_RIGHTS.md",
    published: false,
  },
  {
    slug: "legal-entity",
    title: "Legal Entity",
    summary:
      "The registration decision, what incorporation obliges us to, and the checklist.",
    file: "policies/LEGAL_ENTITY.md",
    published: false,
  },
  {
    slug: "compliance-gaps",
    title: "Compliance Gaps",
    summary: "What we still have to fix, ranked. Read this before relying on any of it.",
    file: "policies/COMPLIANCE_GAPS.md",
    published: false,
  },
];

export const POLICY_BY_SLUG: Record<PolicySlug, PolicyMeta> = POLICIES.reduce(
  (acc, policy) => {
    acc[policy.slug] = policy;
    return acc;
  },
  {} as Record<PolicySlug, PolicyMeta>,
);

export interface PolicyNavLink {
  id: string;
  label: string;
  href: string;
}

/** The policies the site shows, in the order a reader is most likely to want them. */
export const PUBLISHED_POLICIES: PolicyMeta[] = POLICIES.filter((p) => p.published);

/** Where the URL of an unpublished policy redirects. */
export function unpublishedPolicyRedirect(policy: PolicyMeta): string {
  return policy.redirectTo ?? "/policies";
}

/**
 * The pill nav shown above every policy page: the index plus the published
 * documents only. Unpublished ones are not linked from anywhere on the site.
 */
export const POLICY_NAV: PolicyNavLink[] = [
  { id: "index", label: "All policies", href: "/policies" },
  ...PUBLISHED_POLICIES.map((p) => ({
    id: p.slug,
    label: p.title,
    href: `/policies/${p.slug}`,
  })),
];

/**
 * Repository URL, used for links that have no page on the site (the security
 * policy, the contributing guide, the policy set itself).
 */
export const REPO_URL = "https://github.com/Prarambha369/Butwal-Hacks";
