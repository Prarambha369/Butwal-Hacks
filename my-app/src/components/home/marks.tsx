"use client";

import type { JSX } from "react";

/**
 * marks.tsx — hand-drawn-feel glyph family for the marketing homepage.
 *
 * Replaces the generic lucide icon set with a single coherent family of
 * line marks (round caps, slight asymmetry, subtle overlaps drawing them
 * closer to hand-sketched than generated). All marks inherit `currentColor`
 * so the existing colored-box treatments keep working.
 */

type MarkProps = { className?: string };

function Base({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Portable identity — an ID card with a person + detail lines. */
export function MarkId({ className }: MarkProps): JSX.Element {
  return (
    <Base className={className}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <circle cx="8.7" cy="10.1" r="2.1" />
      <path d="M5.3 15.7c1-1.6 2.1-2.3 3.4-2.3s2.4.7 3.4 2.3" />
      <path d="M14 9.4h4M14 12.4h4M14 15.4h2.5" />
    </Base>
  );
}

/** Verified marker — a slightly tilted rubber stamp with a check. */
export function MarkSeal({ className }: MarkProps): JSX.Element {
  return (
    <Base className={className}>
      <rect x="5.4" y="5.4" width="13.2" height="13.2" rx="2.5" transform="rotate(-5 12 12)" />
      <circle cx="12" cy="12" r="4.2" />
      <path d="M9.9 12.1l1.5 1.5 2.9-3.1" />
    </Base>
  );
}

/** Portfolio — a folder with a few lines of work inside. */
export function MarkPortfolio({ className }: MarkProps): JSX.Element {
  return (
    <Base className={className}>
      <path d="M2.8 7a1.8 1.8 0 0 1 1.8-1.8h4l1.6 1.8h8A1.8 1.8 0 0 1 20 8.8v7.2a2 2 0 0 1-2 2H4.8a2 2 0 0 1-2-2V7z" />
      <path d="M7.5 12.5h9M7.5 15h6" />
    </Base>
  );
}

/** Team matching — two overlapping figures. */
export function MarkTeam({ className }: MarkProps): JSX.Element {
  return (
    <Base className={className}>
      <circle cx="8.2" cy="9.1" r="2.6" />
      <path d="M3.9 16.3c1-1.9 2.4-2.8 4.3-2.8s3.3.9 4.3 2.8" />
      <circle cx="16.3" cy="10.6" r="2.2" />
      <path d="M13.4 15.5c.7-1.5 1.6-2.2 2.9-2.2s2.2.7 2.9 2.2" />
    </Base>
  );
}

/** Kanban board — three columns with task dots. */
export function MarkBoard({ className }: MarkProps): JSX.Element {
  return (
    <Base className={className}>
      <rect x="3.2" y="4.5" width="5" height="14.5" rx="1.2" />
      <rect x="9.5" y="4.5" width="5" height="14.5" rx="1.2" />
      <rect x="15.8" y="4.5" width="5" height="14.5" rx="1.2" />
      <circle cx="5.7" cy="8.3" r="1" />
      <circle cx="12" cy="8.3" r="1" />
      <circle cx="18.3" cy="8.3" r="1" />
    </Base>
  );
}

/** Bounty — an award badge with ribbon tails. */
export function MarkBounty({ className }: MarkProps): JSX.Element {
  return (
    <Base className={className}>
      <circle cx="12" cy="9.2" r="4.8" />
      <path d="M10 10.3l1.4 1.4 2.8-3" />
      <path d="M9.3 13.4 8.1 18.4l3.9-1.9 3.9 1.9-1.2-5" />
    </Base>
  );
}

/** GitHub — brand mark (filled). */
export function MarkGithub({ className }: MarkProps): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

/** Community — a single warm heart. */
export function MarkHeart({ className }: MarkProps): JSX.Element {
  return (
    <Base className={className}>
      <path d="M12 5.7c1.9-1.6 4.7-1.4 6.3.5 1.6 1.9 1.2 4.6-.5 6.4l-5.8 5.8-5.8-5.8c-1.7-1.8-2.1-4.5-.5-6.4C7.3 4.3 10.1 4.1 12 5.7z" />
    </Base>
  );
}

/** Mentorship — a graduation cap. */
export function MarkSchool({ className }: MarkProps): JSX.Element {
  return (
    <Base className={className}>
      <path d="M3.5 9.4 12 5l8.5 4.4L12 13.8z" />
      <path d="M7.2 11.4v3.2c0 1.5 2.2 2.9 4.8 2.9s4.8-1.4 4.8-2.9v-3.1" />
      <path d="M20.5 9.5v4.6" />
    </Base>
  );
}

/** Members — two figures in the round. */
export function MarkUsers({ className }: MarkProps): JSX.Element {
  return (
    <Base className={className}>
      <circle cx="8.5" cy="9" r="2.5" />
      <path d="M4.6 15.8c.8-1.8 2.2-2.7 3.9-2.7s3.1.9 3.9 2.7" />
      <circle cx="16" cy="10" r="2" />
      <path d="M13.6 14.5c.5-1.1 1.3-1.7 2.4-1.7s1.9.6 2.4 1.7" />
    </Base>
  );
}

/** Events — a calendar with an event line highlighted. */
export function MarkCalendar({ className }: MarkProps): JSX.Element {
  return (
    <Base className={className}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" />
      <path d="M8 13.8h8M8 16.8h4.5" />
    </Base>
  );
}

/** Camera — a lens with a body ring. */
export function MarkCamera({ className }: MarkProps): JSX.Element {
  return (
    <Base className={className}>
      <circle cx="12" cy="12" r="5.5" />
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M19 12h3M5 12h3" />
      <path d="M12 5v3M12 16v3" />
    </Base>
  );
}

/** Credentials — a certificate card with a person. */
export function MarkCert({ className }: MarkProps): JSX.Element {
  return (
    <Base className={className}>
      <rect x="4" y="3.5" width="16" height="17" rx="2.5" />
      <circle cx="12" cy="10.2" r="2.5" />
      <path d="M8.6 15.4c.8-1.5 2-2.2 3.4-2.2s2.6.7 3.4 2.2" />
    </Base>
  );
}

/** Builders — code brackets. */
export function MarkCode({ className }: MarkProps): JSX.Element {
  return (
    <Base className={className}>
      <path d="M8.5 8 5 12l3.5 4M15.5 8 19 12l-3.5 4M13.4 5.5l-2.8 13" />
    </Base>
  );
}

/** Quote — stylized open quotation mark. */
export function MarkQuote({ className }: MarkProps): JSX.Element {
  return (
    <Base className={className}>
      <path d="M4.5 16c0-2.5.8-4.5 2.5-5.5s3-1.5 3-3c0-1-.5-1.8-1.4-2.4C8.1 5 7 5 6 5v10.5" />
      <path d="M15 16c0-2.5.8-4.5 2.5-5.5s3-1.5 3-3c0-1-.5-1.8-1.4-2.4c-.7-.6-1.8-.6-2.8-.6H13v10.5" />
    </Base>
  );
}

/** Projects — a trophy cup. */
export function MarkTrophy({ className }: MarkProps): JSX.Element {
  return (
    <Base className={className}>
      <path d="M16 5H8v4.5a4 4 0 0 0 8 0z" />
      <path d="M16 6h2a2 2 0 0 1 2 2v.5A3.5 3.5 0 0 1 16.5 12" />
      <path d="M8 6H6a2 2 0 0 0-2 2v.5A3.5 3.5 0 0 0 7.5 12" />
      <path d="M12 13.5V17M8.8 20h6.4M10 21.5h4" />
    </Base>
  );
}