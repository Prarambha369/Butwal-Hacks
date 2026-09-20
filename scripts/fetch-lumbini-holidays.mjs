#!/usr/bin/env node
/**
 * Lumbini public-holiday importer.
 *
 * Source: https://www.officeholidays.com/ics-all/nepal/province-5
 * (rolling feed: roughly the current + next AD year).
 *
 * What it does:
 *  1. Downloads the ICS, parses VEVENTs (SUMMARY + DTSTART).
 *  2. Maps each SUMMARY to an English/Nepali name + kind via NAME_MAP
 *     below. UNMAPPED summaries fail loud — add them, never guess.
 *  3. Drops unusable rows: generic "Public Holiday" (no name) and
 *     "(Not a Public Holiday)" observances our Samiti set already covers.
 *  4. Drops rows colliding (same AD date) with festivals-2083.ts — the
 *     Samiti patro wins ties; the feed fills gaps (Eids, Gaura, Republic
 *     Day, 2084 dates the Samiti file does not cover yet).
 *  5. Converts every AD date to BS with the repo's own engine table
 *     (parsed from src/lib/nepali-date.ts — same anchor, same data).
 *  6. Emits src/lib/public-holidays-<AD year>.ts, one file per AD year.
 *
 * Re-run when the feed rolls forward (new year appears) or to pick up
 * corrections. BH events are NEVER touched: organizer/maintainer dashboard
 * publishing stays the only writer of the events table.
 *
 * Usage: node scripts/fetch-lumbini-holidays.mjs [--write]
 *   Default (no flag) prints what WOULD change. --write writes files.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "my-app");
const SRC = join(ROOT, "src/lib/nepali-date.ts");
const FEED = "https://www.officeholidays.com/ics-all/nepal/province-5";
const WRITE = process.argv.includes("--write");

// ─── ICS SUMMARY -> { nameEn, nameNe, kind } ─────────────────────────
// kind: "holiday" (day off) | "observance" (marked, not a day off).
const NAME_MAP = {
  "Maghe Sankranti": { nameEn: "Maghe Sankranti", nameNe: "माघे संक्रान्ति", kind: "holiday" },
  "Sonam Losar": { nameEn: "Sonam Losar", nameNe: "सोनाम ल्होसार", kind: "holiday" },
  "Martyrs' Day": { nameEn: "Martyrs' Day", nameNe: "शहीद दिवस", kind: "holiday" },
  "Maha Shivaratri": { nameEn: "Maha Shivaratri", nameNe: "महा शिवरात्रि", kind: "holiday" },
  "Gyalpo Lhosar": { nameEn: "Gyalpo Lhosar", nameNe: "ग्याल्पो ल्होसार", kind: "holiday" },
  "Prajatantra Diwas": { nameEn: "Prajatantra Diwas", nameNe: "प्रजातन्त्र दिवस", kind: "holiday" },
  "Fagu Purnima": { nameEn: "Fagu Purnima", nameNe: "फागु पूर्णिमा", kind: "holiday" },
  "Nari Dibas": { nameEn: "Nari Dibas", nameNe: "नारी दिवस", kind: "holiday" },
  "Ramjan Edul Fikra": { nameEn: "Eid al-Fitr", nameNe: "ईद अल-फित्र", kind: "holiday" },
  "Edul Aajha": { nameEn: "Eid al-Adha", nameNe: "ईद अल-अधा", kind: "holiday" },
  "Nepali New Year": { nameEn: "Nepali New Year", nameNe: "नयाँ वर्ष", kind: "holiday" },
  "Buddha Jayanti": { nameEn: "Buddha Jayanti", nameNe: "बुद्ध जयन्ती", kind: "holiday" },
  "Republic Day": { nameEn: "Republic Day", nameNe: "गणतन्त्र दिवस", kind: "holiday" },
  "Gaura Festival": { nameEn: "Gaura Festival", nameNe: "गौरा पर्व", kind: "holiday" },
  "National Mourning Day": { nameEn: "National Mourning Day", nameNe: "राष्ट्रिय शोक दिवस", kind: "observance" },
  "Gen Z Martyrs' Day": { nameEn: "Gen Z Martyrs' Day", nameNe: "जेनजी शहीद दिवस", kind: "observance" },
  "Haritalika Teej": { nameEn: "Haritalika Teej", nameNe: "हरितालिका तीज", kind: "holiday" },
  "Nepali Constitution Day": { nameEn: "Constitution Day", nameNe: "संविधान दिवस", kind: "holiday" },
  "Phulpati": { nameEn: "Phulpati", nameNe: "फूलपाती", kind: "holiday" },
  "Maha Ashtami": { nameEn: "Maha Ashtami", nameNe: "महा अष्टमी", kind: "holiday" },
  "Maha Navami": { nameEn: "Maha Navami", nameNe: "महा नवमी", kind: "holiday" },
  "Subha Vijaya Dashami": { nameEn: "Vijaya Dashami", nameNe: "विजया दशमी", kind: "holiday" },
  "Laxmi Puja": { nameEn: "Laxmi Puja", nameNe: "लक्ष्मी पूजा", kind: "holiday" },
  "Gobardhan Puja": { nameEn: "Gobardhan Puja", nameNe: "गोवर्धन पूजा", kind: "holiday" },
  "Bhai Tika": { nameEn: "Bhai Tika", nameNe: "भाइ टीका", kind: "holiday" },
  "Chaath Puja": { nameEn: "Chhath Parva", nameNe: "छठ पर्व", kind: "holiday" },
  "Guru Nanak's Birthday": { nameEn: "Guru Nanak Jayanti", nameNe: "गुरु नानक जयन्ती", kind: "holiday" },
  "Christmas Day": { nameEn: "Christmas Day", nameNe: "क्रिसमस डे", kind: "holiday" },
  "Tamu Lhosar": { nameEn: "Tamu Lhosar", nameNe: "तमु ल्होसार", kind: "holiday" },
};

// Rows that can never become entries.
const DROP_EXACT = new Set(["Public Holiday"]); // generic filler, no name
const DROP_SUFFIX = "(Not a Public Holiday)"; // covered by our Samiti set

// ─── Engine (same table + anchor as src/lib/nepali-date.ts) ──────────
function loadTable() {
  const src = readFileSync(SRC, "utf8");
  const table = {};
  for (const m of src.matchAll(/^\s*(\d{4}): \[([\d, ]+)\]/gm)) {
    table[Number(m[1])] = m[2].split(",").map(Number);
  }
  if (!table[2083] || !table[2084]) throw new Error("engine table parse failed");
  return table;
}

function adToBs(y, m, d, BS) {
  let diff = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1943, 3, 14)) / 86400000);
  let by = 2000, bm = 1, bd = 1 + diff;
  while (bd > BS[by][bm - 1]) { bd -= BS[by][bm - 1]; bm++; if (bm > 12) { bm = 1; by++; } }
  while (bd < 1) { bm--; if (bm < 1) { bm = 12; by--; } bd += BS[by][bm - 1]; }
  return [by, bm, bd];
}

// ─── Samiti collision map (AD iso -> nameEn from festivals-2083.ts) ───
function samitiByAd() {
  const src = readFileSync(join(ROOT, "src/lib/festivals-2083.ts"), "utf8");
  const map = new Map();
  for (const m of src.matchAll(/nameEn: "(.*?)",[\s\S]*?ad: \[(\d+), (\d+), (\d+)\]/g)) {
    const iso = `${m[2]}-${m[3].padStart(2, "0")}-${m[4].padStart(2, "0")}`;
    (map.get(iso) ?? map.set(iso, []).get(iso)).push(m[1]);
  }
  return map;
}

const STOP = new Set("subha sri shree parva puja festival day dibas diwas jayanti tihar tika happy merry national public holiday".split(" "));
const tokens = (s) => new Set(s.toLowerCase().split(/[^a-z]+/).filter((w) => w && !STOP.has(w)));

/** Same festival if the mapped feed name shares a real word with a Samiti name that day. */
function sameFestival(feedEn, samitiNames) {
  const f = tokens(feedEn);
  return samitiNames.some((n) => {
    const s = tokens(n);
    for (const w of f) if (s.has(w)) return true;
    return false;
  });
}

function slugify(en, iso) {
  return en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + iso.slice(0, 4);
}

// ─── Main ────────────────────────────────────────────────────────────
const BS = loadTable();
const samiti = samitiByAd();

const res = await fetch(FEED, { headers: { "User-Agent": "ButwalHacks-holiday-import/1.0" } });
if (!res.ok) throw new Error(`feed fetch failed: ${res.status}`);
const ics = await res.text();

const byYear = {};
let dropped = [];
for (const chunk of ics.split("BEGIN:VEVENT").slice(1)) {
  const dt = chunk.match(/DTSTART;VALUE=DATE:(\d{4})(\d{2})(\d{2})/);
  const sum = chunk.match(/SUMMARY[^:]*:(.*)/);
  if (!dt || !sum) continue;
  const [y, mo, d] = [dt[1], dt[2], dt[3]];
  const summary = sum[1].trim();
  const iso = `${y}-${mo}-${d}`;

  if (DROP_EXACT.has(summary)) { dropped.push(`${iso} ${summary} (generic)`); continue; }
  if (summary.endsWith(DROP_SUFFIX)) { dropped.push(`${iso} ${summary} (samiti-covered observance)`); continue; }
  const meta = NAME_MAP[summary];
  if (!meta) throw new Error(`UNMAPPED summary "${summary}" on ${iso} — add it to NAME_MAP, never guess.`);
  if (samiti.has(iso)) {
    if (sameFestival(meta.nameEn, samiti.get(iso))) {
      dropped.push(`${iso} ${summary} (samiti wins)`);
      continue;
    }
    // Same solar day, different observance (e.g. Gaura on Janmashtami):
    // both are real, keep the feed row.
  }

  const bs = adToBs(Number(y), Number(mo), Number(d), BS);
  (byYear[y] ??= []).push({
    slug: slugify(meta.nameEn, iso) + (byYear[y].some((e) => e.slug.startsWith(slugify(meta.nameEn, iso))) ? "-2" : ""),
    ...meta,
    bs, ad: [Number(y), Number(mo), Number(d)],
  });
}

for (const [year, rows] of Object.entries(byYear).sort()) {
  rows.sort((a, b) => a.ad[0] - b.ad[0] || a.ad[1] - b.ad[1] || a.ad[2] - b.ad[2]);
  const body = rows.map((r) =>
    `  {\n    slug: "${r.slug}",\n    nameEn: "${r.nameEn}",\n    nameNe: "${r.nameNe}",\n    kind: "${r.kind}",\n    bs: [${r.bs.join(", ")}],\n    ad: [${r.ad.join(", ")}],\n  },`).join("\n");
  const out = `/**
 * Lumbini public holidays, AD ${year} — imported from the OfficeHolidays
 * Province-5 feed (${FEED}).
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

export const PUBLIC_HOLIDAYS_${year}: PublicHolidayEntry[] = [
${body}
];
`;
  const dest = join(ROOT, `src/lib/public-holidays-${year}.ts`);
  const prev = existsSync(dest) ? readFileSync(dest, "utf8") : null;
  if (prev === out) {
    console.log(`${year}: unchanged (${rows.length} rows)`);
  } else {
    console.log(`${year}: ${prev ? "UPDATE" : "NEW"} (${rows.length} rows)${WRITE ? " — written" : " — preview only"}`);
    if (WRITE) writeFileSync(dest, out);
  }
}
console.log(`dropped ${dropped.length}:`);
for (const d of dropped) console.log("  -", d);
