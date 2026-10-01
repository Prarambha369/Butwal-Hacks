/**
 * JSON-LD builders for the content-rich surfaces.
 *
 * Every builder here is derived from data the page already renders. Google's
 * structured-data guidelines require FAQ and HowTo markup to match content
 * visible on the page, so these take the same arrays the components map over
 * rather than a parallel copy that can drift -- the event FAQ lives in one
 * place and feeds both the visible accordion and the schema.
 *
 * Nothing is invented to satisfy a validator. Where a recommended field has no
 * real value (a blog post has no author field), the organisation is credited
 * as author, which is factually the publisher, rather than inventing a person.
 */

import { SITE_URL } from "@/lib/constants";
import { siteName as SITE_NAME } from "@/lib/seo";

const ORG_ID = `${SITE_URL}/#organization`;

function organization() {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
  };
}

export interface FaqItem {
  q: string;
  a: string;
}

/**
 * FAQPage. Pass the exact items rendered in the visible FAQ section.
 */
export function faqPageJsonLd(faqs: FaqItem[], url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    url,
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export interface EventSchemaInput {
  title: string;
  description?: string | null;
  /** ISO 8601. */
  startDate: string;
  /** ISO 8601. */
  endDate?: string | null;
  url: string;
  image?: string | null;
  /** Human-readable venue, if the event names one. */
  locationName?: string | null;
  attendanceMode?: "OfflineEventAttendanceMode" | "OnlineEventAttendanceMode" | "MixedEventAttendanceMode";
}

/**
 * Event markup for the organiser-maintained events under /events.
 *
 * The festival pages already ship their own Event builder in lib/festivals.ts,
 * which is deliberately separate: those are 191 static heritage dates with
 * fixed venues, while these are database rows. Merging them would mean one
 * builder half-satisfying the other.
 */
export function eventJsonLd(e: EventSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    description: e.description ?? undefined,
    startDate: e.startDate,
    endDate: e.endDate ?? e.startDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: `https://schema.org/${
      e.attendanceMode ?? "OfflineEventAttendanceMode"
    }`,
    url: e.url,
    image: e.image ? [e.image] : undefined,
    organizer: { "@id": ORG_ID },
    inLanguage: ["ne", "en"],
    isAccessibleForFree: true,
    ...(e.locationName
      ? {
          location: {
            "@type": "Place",
            name: e.locationName,
            address: {
              "@type": "PostalAddress",
              addressLocality: "Butwal",
              addressRegion: "Lumbini",
              addressCountry: "NP",
            },
          },
        }
      : {}),
  };
}

export interface BlogPostingInput {
  title: string;
  excerpt?: string | null;
  url: string;
  /** YYYY-MM-DD */
  datePublished: string;
  dateModified?: string;
  image?: string | null;
  keywords?: string[];
}

/**
 * BlogPosting for a single post.
 *
 * No author is invented: the posts have no author column, so the organisation
 * that published them is credited, which is what actually happened.
 */
export function blogPostingJsonLd(p: BlogPostingInput) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${p.url}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": p.url },
    headline: p.title.slice(0, 110),
    description: p.excerpt ?? undefined,
    datePublished: p.datePublished,
    dateModified: p.dateModified ?? p.datePublished,
    url: p.url,
    image: p.image ? [p.image] : undefined,
    keywords: p.keywords?.length ? p.keywords : undefined,
    inLanguage: ["ne", "en"],
    isAccessibleForFree: true,
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
  };
}

export { organization as organizationJsonLd, ORG_ID as ORGANIZATION_ID };
