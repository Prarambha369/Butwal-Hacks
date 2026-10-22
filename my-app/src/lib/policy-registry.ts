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
export const POLICY_VERSION = "2026-10-21";

/** Human-readable form of the version above, shown on the policy pages. */
export const POLICY_LAST_UPDATED = "October 21, 2026";

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
}

export const POLICIES: PolicyMeta[] = [
  {
    slug: "code-of-conduct",
    title: "Code of Conduct",
    summary:
      "The behaviour standard for every Butwal Hacks space, and how to report a violation.",
    file: "CODE_OF_CONDUCT.md",
  },
  {
    slug: "terms",
    title: "Terms of Service",
    summary:
      "The contract of use: what you may do here, who owns what, and how it ends.",
    file: "policies/TERMS_OF_SERVICE.md",
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    summary:
      "What we collect, why, who sees it, and the rights you have over it.",
    file: "policies/PRIVACY_POLICY.md",
  },
  {
    slug: "cookies",
    title: "Cookie Policy",
    summary: "Which cookies and local storage we set, and how to refuse them.",
    file: "policies/COOKIE_POLICY.md",
  },
  {
    slug: "acceptable-use",
    title: "Acceptable Use Policy",
    summary: "What use of the platform is tolerated, and what is not.",
    file: "policies/ACCEPTABLE_USE_POLICY.md",
  },
  {
    slug: "participant-and-guardian-terms",
    title: "Participant and Guardian Terms",
    summary:
      "What a participant under 18 agrees to, and what their guardian consents to.",
    file: "policies/PARTICIPANT_AND_GUARDIAN_TERMS.md",
  },
  {
    slug: "safeguarding",
    title: "Safeguarding Policy",
    summary:
      "Our commitments to participants under 18, and the staff boundaries that go with them.",
    file: "policies/SAFEGUARDING_POLICY.md",
  },
  {
    slug: "hackathon-rules",
    title: "Hackathon Rules",
    summary:
      "The rules of an event: what you may build, what you must disclose, and the grounds for disqualification.",
    file: "policies/HACKATHON_RULES.md",
  },
  {
    slug: "registration-notices",
    title: "Registration Notices",
    summary:
      "The exact consent text captured at registration and project submission, and what is recorded.",
    file: "policies/REGISTRATION_NOTICES.md",
  },
  {
    slug: "cheating-response",
    title: "Cheating Response",
    summary:
      "What happens when a project is suspected of not having been built during the event.",
    file: "policies/CHEATING_RESPONSE.md",
  },
  {
    slug: "incident-response",
    title: "Incident Response",
    summary:
      "The step-by-step procedure followed after a code of conduct report is filed.",
    file: "policies/INCIDENT_RESPONSE.md",
  },
  {
    slug: "disciplinary-action",
    title: "Disciplinary Action",
    summary:
      "The ladder of sanctions, how they are notified, and how they can be appealed.",
    file: "policies/DISCIPLINARY_ACTION.md",
  },
  {
    slug: "community-values",
    title: "Community Values",
    summary: "What we hold ourselves to when we run an event.",
    file: "policies/COMMUNITY_VALUES.md",
  },
  {
    slug: "data-subject-rights",
    title: "Data Subject Rights",
    summary: "How to exercise your rights, and the deadlines we work to.",
    file: "policies/DATA_SUBJECT_RIGHTS.md",
  },
  {
    slug: "legal-entity",
    title: "Legal Entity",
    summary:
      "The registration decision, what incorporation obliges us to, and the checklist.",
    file: "policies/LEGAL_ENTITY.md",
  },
  {
    slug: "compliance-gaps",
    title: "Compliance Gaps",
    summary: "What we still have to fix, ranked. Read this before relying on any of it.",
    file: "policies/COMPLIANCE_GAPS.md",
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

/**
 * The pill nav shown above every policy page: the whole governing set, in the
 * order a reader is most likely to want it.
 */
export const POLICY_NAV: PolicyNavLink[] = POLICIES.map((p) => ({
  id: p.slug,
  label: p.title,
  href: `/policies/${p.slug}`,
}));

/**
 * Repository URL, used for links that have no page on the site (the security
 * policy, the contributing guide, the policy set itself).
 */
export const REPO_URL = "https://github.com/Prarambha369/Butwal-Hacks";
