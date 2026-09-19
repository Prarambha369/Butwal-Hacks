/**
 * Lumbini public holidays, AD 2027 — imported from the OfficeHolidays
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

export const PUBLIC_HOLIDAYS_2027: PublicHolidayEntry[] = [
  {
    slug: "gyalpo-lhosar-2027",
    nameEn: "Gyalpo Lhosar",
    nameNe: "ग्याल्पो ल्होसार",
    kind: "holiday",
    bs: [2083, 11, 21],
    ad: [2027, 3, 5],
  },
  {
    slug: "nari-dibas-2027",
    nameEn: "Nari Dibas",
    nameNe: "नारी दिवस",
    kind: "holiday",
    bs: [2083, 11, 24],
    ad: [2027, 3, 8],
  },
  {
    slug: "eid-al-fitr-2027",
    nameEn: "Eid al-Fitr",
    nameNe: "ईद अल-फित्र",
    kind: "holiday",
    bs: [2083, 11, 25],
    ad: [2027, 3, 9],
  },
  {
    slug: "fagu-purnima-2027",
    nameEn: "Fagu Purnima",
    nameNe: "फागु पूर्णिमा",
    kind: "holiday",
    bs: [2083, 12, 8],
    ad: [2027, 3, 22],
  },
  {
    slug: "fagu-purnima-2027-2",
    nameEn: "Fagu Purnima",
    nameNe: "फागु पूर्णिमा",
    kind: "holiday",
    bs: [2083, 12, 9],
    ad: [2027, 3, 23],
  },
  {
    slug: "nepali-new-year-2027",
    nameEn: "Nepali New Year",
    nameNe: "नयाँ वर्ष",
    kind: "holiday",
    bs: [2084, 1, 1],
    ad: [2027, 4, 14],
  },
  {
    slug: "eid-al-adha-2027",
    nameEn: "Eid al-Adha",
    nameNe: "ईद अल-अधा",
    kind: "holiday",
    bs: [2084, 2, 2],
    ad: [2027, 5, 16],
  },
  {
    slug: "buddha-jayanti-2027",
    nameEn: "Buddha Jayanti",
    nameNe: "बुद्ध जयन्ती",
    kind: "holiday",
    bs: [2084, 2, 6],
    ad: [2027, 5, 20],
  },
  {
    slug: "republic-day-2027",
    nameEn: "Republic Day",
    nameNe: "गणतन्त्र दिवस",
    kind: "holiday",
    bs: [2084, 2, 15],
    ad: [2027, 5, 29],
  },
  {
    slug: "gaura-festival-2027",
    nameEn: "Gaura Festival",
    nameNe: "गौरा पर्व",
    kind: "holiday",
    bs: [2084, 5, 8],
    ad: [2027, 8, 24],
  },
  {
    slug: "haritalika-teej-2027",
    nameEn: "Haritalika Teej",
    nameNe: "हरितालिका तीज",
    kind: "holiday",
    bs: [2084, 5, 18],
    ad: [2027, 9, 3],
  },
  {
    slug: "constitution-day-2027",
    nameEn: "Constitution Day",
    nameNe: "संविधान दिवस",
    kind: "holiday",
    bs: [2084, 6, 4],
    ad: [2027, 9, 20],
  },
  {
    slug: "phulpati-2027",
    nameEn: "Phulpati",
    nameNe: "फूलपाती",
    kind: "holiday",
    bs: [2084, 6, 20],
    ad: [2027, 10, 6],
  },
  {
    slug: "maha-navami-2027",
    nameEn: "Maha Navami",
    nameNe: "महा नवमी",
    kind: "holiday",
    bs: [2084, 6, 22],
    ad: [2027, 10, 8],
  },
  {
    slug: "maha-ashtami-2027",
    nameEn: "Maha Ashtami",
    nameNe: "महा अष्टमी",
    kind: "holiday",
    bs: [2084, 6, 23],
    ad: [2027, 10, 9],
  },
  {
    slug: "vijaya-dashami-2027",
    nameEn: "Vijaya Dashami",
    nameNe: "विजया दशमी",
    kind: "holiday",
    bs: [2084, 6, 24],
    ad: [2027, 10, 10],
  },
  {
    slug: "laxmi-puja-2027",
    nameEn: "Laxmi Puja",
    nameNe: "लक्ष्मी पूजा",
    kind: "holiday",
    bs: [2084, 7, 13],
    ad: [2027, 10, 29],
  },
  {
    slug: "gobardhan-puja-2027",
    nameEn: "Gobardhan Puja",
    nameNe: "गोवर्धन पूजा",
    kind: "holiday",
    bs: [2084, 7, 14],
    ad: [2027, 10, 30],
  },
  {
    slug: "bhai-tika-2027",
    nameEn: "Bhai Tika",
    nameNe: "भाइ टीका",
    kind: "holiday",
    bs: [2084, 7, 15],
    ad: [2027, 10, 31],
  },
  {
    slug: "chhath-parva-2027",
    nameEn: "Chhath Parva",
    nameNe: "छठ पर्व",
    kind: "holiday",
    bs: [2084, 7, 19],
    ad: [2027, 11, 4],
  },
  {
    slug: "guru-nanak-jayanti-2027",
    nameEn: "Guru Nanak Jayanti",
    nameNe: "गुरु नानक जयन्ती",
    kind: "holiday",
    bs: [2084, 7, 28],
    ad: [2027, 11, 13],
  },
  {
    slug: "christmas-day-2027",
    nameEn: "Christmas Day",
    nameNe: "क्रिसमस डे",
    kind: "holiday",
    bs: [2084, 9, 10],
    ad: [2027, 12, 25],
  },
  {
    slug: "tamu-lhosar-2027",
    nameEn: "Tamu Lhosar",
    nameNe: "तमु ल्होसार",
    kind: "holiday",
    bs: [2084, 9, 15],
    ad: [2027, 12, 30],
  },
];
