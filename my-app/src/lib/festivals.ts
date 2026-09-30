/**
 * All festivals across BS years — one rollup for the calendar, festival
 * pages, and sitemap.
 *
 * - 2083 is Samiti-seeded (authoritative, human writeups).
 * - Other years are Hamro Patro-feed imports (major observances only)
 *   with human one-line writeups.
 */
import { FESTIVALS_2081 } from "./festivals-2081";
import { FESTIVALS_2082 } from "./festivals-2082";
import { FESTIVALS_2083, TRADITION_META, type FestivalEntry, type FestivalTradition } from "./festivals-2083";
import { siteUrl } from "./seo";

export type { FestivalEntry, FestivalTradition };
export { TRADITION_META };

export const ALL_FESTIVALS: FestivalEntry[] = [
  ...FESTIVALS_2081,
  ...FESTIVALS_2082,
  ...FESTIVALS_2083,
];

export function getFestivalAll(slug: string) {
  return ALL_FESTIVALS.find((f) => f.slug === slug) ?? null;
}

export function getFestivalsByGroupAll(group: string, year: number) {
  return ALL_FESTIVALS.filter((f) => f.bs[0] === year && f.group === group);
}

function adToIso([y, m, d]: [number, number, number]): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * schema.org/Event for one festival page.
 *
 * 191 of the 222 sitemap URLs are festival pages, and none of them emitted any
 * Event markup at all, so Google could not surface them in the Events surface
 * even though every one is a real dated public observance. Google's event
 * requirements are name, startDate, location and — for free events — an offers
 * block with price 0; all are present here.
 *
 * `performer` is deliberately absent. A festival or public holiday has no
 * performer, and `organizer` is the semantically correct property. Search
 * Console reports `performer` as missing on event markup that does not exist,
 * so adding it here would be inventing a performer to satisfy a metric.
 */
export function festivalEventJsonLd(f: FestivalEntry) {
  const iso = adToIso(f.ad);
  const url = `${siteUrl}/festivals/${f.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${f.nameEn} ${f.bs[0]} (${f.nameNe})`,
    description: f.contextEn,
    startDate: iso,
    endDate: iso,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url,
    image: [`${siteUrl}/icon-512.png`],
    inLanguage: ["ne", "en"],
    isAccessibleForFree: true,
    location: {
      "@type": "Place",
      name: `${f.nameEn}, Butwal`,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Butwal",
        addressRegion: "Lumbini",
        addressCountry: "NP",
      },
    },
    organizer: {
      "@type": "Organization",
      name: "Butwal Hacks",
      url: siteUrl,
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "NPR",
      availability: "https://schema.org/InStock",
      url,
      validFrom: iso,
    },
  };
}
