/**
 * Lumbini public holidays, AD 2026 — imported from the OfficeHolidays
 * Province-5 feed (https://www.officeholidays.com/ics-all/nepal/province-5).
 *
 * Regenerate with: node scripts/fetch-lumbini-holidays.mjs --write
 * (prints a diff preview without the flag).
 *
 * Rules baked in by the importer:
 * - Samiti patro (festivals-2083.ts) wins same-date ties; the feed fills
 *   gaps (Eids, Gaura, Republic Day, years the Samiti file lacks).
 * - Generic "Public Holiday" rows and "(Not a Public Holiday)"
 *   observances are dropped, never imported.
 * - BH events are independent: dashboard publishing is the only writer of
 *   the events table. This file never touches it.
 */
import type { PublicHolidayEntry } from "./public-holidays";

export const PUBLIC_HOLIDAYS_2026: PublicHolidayEntry[] = [
  {
    slug: "maghe-sankranti-2026",
    nameEn: "Maghe Sankranti",
    nameNe: "माघे संक्रान्ति",
    kind: "holiday",
    bs: [2082, 9, 30],
    ad: [2026, 1, 14],
  },
  {
    slug: "sonam-losar-2026",
    nameEn: "Sonam Losar",
    nameNe: "सोनाम ल्होसार",
    kind: "holiday",
    bs: [2082, 10, 5],
    ad: [2026, 1, 19],
  },
  {
    slug: "martyrs-day-2026",
    nameEn: "Martyrs' Day",
    nameNe: "शहीद दिवस",
    kind: "holiday",
    bs: [2082, 10, 16],
    ad: [2026, 1, 30],
  },
  {
    slug: "maha-shivaratri-2026",
    nameEn: "Maha Shivaratri",
    nameNe: "महा शिवरात्रि",
    kind: "holiday",
    bs: [2082, 11, 3],
    ad: [2026, 2, 15],
  },
  {
    slug: "gyalpo-lhosar-2026",
    nameEn: "Gyalpo Lhosar",
    nameNe: "ग्याल्पो ल्होसार",
    kind: "holiday",
    bs: [2082, 11, 6],
    ad: [2026, 2, 18],
  },
  {
    slug: "prajatantra-diwas-2026",
    nameEn: "Prajatantra Diwas",
    nameNe: "प्रजातन्त्र दिवस",
    kind: "holiday",
    bs: [2082, 11, 7],
    ad: [2026, 2, 19],
  },
  {
    slug: "fagu-purnima-2026",
    nameEn: "Fagu Purnima",
    nameNe: "फागु पूर्णिमा",
    kind: "holiday",
    bs: [2082, 11, 18],
    ad: [2026, 3, 2],
  },
  {
    slug: "fagu-purnima-2026-2",
    nameEn: "Fagu Purnima",
    nameNe: "फागु पूर्णिमा",
    kind: "holiday",
    bs: [2082, 11, 19],
    ad: [2026, 3, 3],
  },
  {
    slug: "nari-dibas-2026",
    nameEn: "Nari Dibas",
    nameNe: "नारी दिवस",
    kind: "holiday",
    bs: [2082, 11, 24],
    ad: [2026, 3, 8],
  },
  {
    slug: "eid-al-fitr-2026",
    nameEn: "Eid al-Fitr",
    nameNe: "ईद अल-फित्र",
    kind: "holiday",
    bs: [2082, 12, 7],
    ad: [2026, 3, 21],
  },
  {
    slug: "eid-al-adha-2026",
    nameEn: "Eid al-Adha",
    nameNe: "ईद अल-अधा",
    kind: "holiday",
    bs: [2083, 2, 14],
    ad: [2026, 5, 28],
  },
  {
    slug: "republic-day-2026",
    nameEn: "Republic Day",
    nameNe: "गणतन्त्र दिवस",
    kind: "holiday",
    bs: [2083, 2, 15],
    ad: [2026, 5, 29],
  },
  {
    slug: "gaura-festival-2026",
    nameEn: "Gaura Festival",
    nameNe: "गौरा पर्व",
    kind: "holiday",
    bs: [2083, 5, 19],
    ad: [2026, 9, 4],
  },
  {
    slug: "national-mourning-day-2026",
    nameEn: "National Mourning Day",
    nameNe: "राष्ट्रिय शोक दिवस",
    kind: "observance",
    bs: [2083, 5, 22],
    ad: [2026, 9, 7],
  },
  {
    slug: "gen-z-martyrs-day-2026",
    nameEn: "Gen Z Martyrs' Day",
    nameNe: "जेनजी शहीद दिवस",
    kind: "observance",
    bs: [2083, 5, 23],
    ad: [2026, 9, 8],
  },
  {
    slug: "phulpati-2026",
    nameEn: "Phulpati",
    nameNe: "फूलपाती",
    kind: "holiday",
    bs: [2083, 7, 1],
    ad: [2026, 10, 18],
  },
  {
    slug: "maha-ashtami-2026",
    nameEn: "Maha Ashtami",
    nameNe: "महा अष्टमी",
    kind: "holiday",
    bs: [2083, 7, 2],
    ad: [2026, 10, 19],
  },
  {
    slug: "vijaya-dashami-2026",
    nameEn: "Vijaya Dashami",
    nameNe: "विजया दशमी",
    kind: "holiday",
    bs: [2083, 7, 5],
    ad: [2026, 10, 22],
  },
  {
    slug: "gobardhan-puja-2026",
    nameEn: "Gobardhan Puja",
    nameNe: "गोवर्धन पूजा",
    kind: "holiday",
    bs: [2083, 7, 24],
    ad: [2026, 11, 10],
  },
  {
    slug: "guru-nanak-jayanti-2026",
    nameEn: "Guru Nanak Jayanti",
    nameNe: "गुरु नानक जयन्ती",
    kind: "holiday",
    bs: [2083, 8, 8],
    ad: [2026, 11, 24],
  },
];
