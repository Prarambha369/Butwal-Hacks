#!/usr/bin/env node
/**
 * Nepali-festival importer (multi-year).
 *
 * Source: http://shresthasushil.com.np/NepaliEvents/Nepali%20Events.ics
 * (Hamro Patro-based community feed, currently spans AD 2024-2027).
 * Download a fresh copy to /tmp/audit/nepali-events.ics (or pass a path)
 * before running — the host can be flaky, so the fetch is manual.
 *
 * What it does:
 *  1. Unfolds ICS line folding, parses VEVENTs (Nepali SUMMARY + DTSTART).
 *  2. Keeps ONLY major public observances via the exact-name NAME_MAP.
 *     Routine vrats, sankrantis, shraddhas, saint jayantis, valley-only
 *     jatras and international days are skipped by design (calendar noise).
 *     UNMAPPED non-skipped summaries fail loud — add them, never guess.
 *  3. Collapses same-day same-festival duplicates.
 *  4. Drops rows the Samiti file (festivals-2083.ts) or the Lumbini
 *     holiday files already cover (same solar day + same festival by
 *     keyword; richest source wins).
 *  5. Converts AD -> BS with the repo's own engine table and emits
 *     src/lib/festivals-<BS year>.ts. Never touches 2083 (Samiti).
 *
 * BH events are NEVER touched: dashboard publishing stays the only
 * writer of the events table.
 *
 * Usage: node scripts/fetch-nepali-events.mjs [ics-path] [--write]
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "my-app");
const ICS_PATH = process.argv[2] && !process.argv[2].startsWith("--")
  ? process.argv[2]
  : "/tmp/audit/nepali-events.ics";
const WRITE = process.argv.includes("--write");

// [nameEn, nameNe, tradition, group]
const NAME_MAP = {
  "विजया दशमी": ["Vijaya Dashami", "विजया दशमी", "hindu", "dashain"],
  "महाअष्टमी व्रत": ["Maha Ashtami", "महा अष्टमी", "hindu", "dashain"],
  "महानवमी व्रत": ["Maha Navami", "महा नवमी", "hindu", "dashain"],
  "काग तिहार": ["Kag Tihar", "काग तिहार", "hindu", "tihar"],
  "कुकुर तिहार": ["Kukur Tihar", "कुकुर तिहार", "hindu", "tihar"],
  "लक्ष्मी पूजा": ["Laxmi Puja", "लक्ष्मी पूजा", "hindu", "tihar"],
  "गोवर्धन पूजा": ["Gobardhan Puja", "गोवर्धन पूजा", "hindu", "tihar"],
  "गाईगोरु पूजा": ["Gai Tihar", "गाई तिहार", "hindu", "tihar"],
  "भाइटीका": ["Bhai Tika", "भाइ टीका", "hindu", "tihar"],
  "म्हपूजा": ["Mha Puja", "म्ह पूजा", "janajati", "tihar"],
  "किजा पूजा": ["Kija Puja", "किजा पूजा", "janajati", "tihar"],
  "हलि तिहार": ["Hali Tihar", "हलि तिहार", "hindu", "tihar"],
  "छठ पर्व": ["Chhath Parva", "छठ पर्व", "hindu", "chhath"],
  "चथाः पूजा": ["Chhath Parva", "छठ पर्व", "hindu", "chhath"],
  "हरितालिका तीज": ["Haritalika Teej", "हरितालिका तीज", "hindu", "teej"],
  "ऋषिपञ्चमी व्रत": ["Rishi Panchami", "ऋषि पञ्चमी", "hindu", "teej"],
  "जनै पूर्णिमा": ["Raksha Bandhan", "रक्षाबन्धन", "hindu", "raksha-bandhan"],
  "रक्षा बन्धन": ["Raksha Bandhan", "रक्षाबन्धन", "hindu", "raksha-bandhan"],
  "श्रीकृष्ण जन्माष्टमी": ["Krishna Janmashtami", "कृष्ण जन्माष्टमी", "hindu", "krishna-janmashtami"],
  "महाशिवरात्रि व्रत": ["Maha Shivaratri", "महा शिवरात्रि", "hindu", "maha-shivaratri"],
  "बुद्ध जयन्ती": ["Buddha Jayanti", "बुद्ध जयन्ती", "buddhist", "buddha-jayanti"],
  "सोनाम ल्होछार": ["Sonam Lhosar", "सोनाम ल्होसार", "buddhist", "sonam-lhosar"],
  "तमु ल्होसार": ["Tamu Lhosar", "तमु ल्होसार", "janajati", "tamu-lhosar"],
  "ग्याल्पो ल्होछार": ["Gyalpo Lhosar", "ग्याल्पो ल्होसार", "buddhist", "gyalpo-lhosar"],
  "ग्याल्पो ल्होसार": ["Gyalpo Lhosar", "ग्याल्पो ल्होसार", "buddhist", "gyalpo-lhosar"],
  "तोल ल्होसार": ["Tol Lhosar", "तोल ल्होसार", "janajati", "tol-lhosar"],
  "उधौली पर्व": ["Udhauli", "उधौली", "janajati", "udhauli"],
  "उँधौली पर्व": ["Udhauli", "उधौली", "janajati", "udhauli"],
  "उभौली पर्व": ["Ubhauli", "उभौली", "janajati", "ubhauli"],
  "चैते दशैँ": ["Chaite Dashain", "चैते दशैं", "hindu", "chaite-dashain"],
  "माघे संक्रान्ति": ["Maghe Sankranti", "माघे संक्रान्ति", "hindu", "maghe-sankranti"],
  "संविधान दिवस": ["Constitution Day", "संविधान दिवस", "civic", "constitution-day"],
  "गणतन्त्र दिवस": ["Republic Day", "गणतन्त्र दिवस", "civic", "prajatantra-diwas"],
  "प्रजातन्त्र दिवस": ["Prajatantra Diwas", "प्रजातन्त्र दिवस", "civic", "prajatantra-diwas"],
  "लोकतन्त्र दिवस": ["Loktantra Diwas", "लोकतन्त्र दिवस", "civic", "loktantra-diwas"],
  "शहीद दिवस": ["Martyrs' Day", "शहीद दिवस", "civic", "martyrs-day"],
  "पृथ्वी जयन्ती": ["Prithvi Jayanti", "पृथ्वी जयन्ती", "civic", "prithvi-jayanti"],
  "नारी दिवस": ["Women's Day", "नारी दिवस", "civic", "womens-day"],
  "ईद उल फितर": ["Eid al-Fitr", "ईद अल-फित्र", "muslim", "eid-fitr"],
  "बकर ईद (ईद-उल-अज्हा)": ["Eid al-Adha", "ईद अल-अधा", "muslim", "eid-adha"],
  "बक्र ईद (उल–अजहा)": ["Eid al-Adha", "ईद अल-अधा", "muslim", "eid-adha"],
  "क्रिसमस-डे": ["Christmas Day", "क्रिसमस डे", "christian", "christmas"],
  "जितियापर्व": ["Jitiya Parva", "जितिया पर्व", "janajati", "jitiya"],
  "चेपाङ चोनाम पर्व": ["Chepang Chonam", "चेपाङ चोनाम", "janajati", "chepang-chonam"],
  "थारु गुरिया पर्व": ["Tharu Guriya", "थारु गुरिया", "janajati", "tharu-guriya"],
  "टोपी दिवस": ["Topi Diwas", "टोपी दिवस", "civic", "topi-diwas"],
  "सरस्वती पूजा": ["Saraswati Puja", "सरस्वती पूजा", "hindu", "saraswati-puja"],
  "श्री राम नवमी व्रत": ["Ram Nawami", "रामनवमी", "hindu", "ram-nawami"],
  "रामनवमी व्रत": ["Ram Nawami", "रामनवमी", "hindu", "ram-nawami"],
  "नागपञ्चमी": ["Nag Panchami", "नागपञ्चमी", "hindu", "nag-panchami"],
  "नाग पञ्चमी व्रत": ["Nag Panchami", "नागपञ्चमी", "hindu", "nag-panchami"],
  "गणेश चतुर्थी": ["Ganesh Chaturthi", "गणेश चतुर्थी", "hindu", "ganesh-chaturthi"],
  "विवाह पञ्चमी": ["Vivah Panchami", "विवाह पञ्चमी", "hindu", "vivah-panchami"],
  "बाला चतुर्दशी व्रत": ["Bala Chaturdashi", "बाला चतुर्दशी", "hindu", "bala-chaturdashi"],
  "कुशे औंसी": ["Kushe Aunsi", "कुशे औंसी", "hindu", "kushe-aunsi"],
  "मातातीर्थ औंसी": ["Mata Tirtha Aunsi", "मातातीर्थ औंसी", "hindu", "mata-tirtha-aunsi"],
  "धन त्रयोदशी व्रत (धनतेरस)": ["Dhanteras", "धनतेरस", "hindu", "tihar"],
  "नरक चतुर्दशी": ["Narak Chaturdashi", "नरक चतुर्दशी", "hindu", "tihar"],
  "अक्षय तृतीया": ["Akshaya Tritiya", "अक्षय तृतीया", "hindu", "akshaya-tritiya"],
  "अनन्त चतुर्दशी व्रत": ["Ananta Chaturdashi", "अनन्त चतुर्दशी", "hindu", "ananta-chaturdashi"],
  "गीता जयन्ती": ["Gita Jayanti", "गीता जयन्ती", "hindu", "gita-jayanti"],
  "गढीमाई मेला प्रारम्भ": ["Gadhimai Mela", "गढीमाई मेला", "hindu", "gadhimai"],
  "गणगौर पूजा प्रारम्भ": ["Gangaur Puja", "गणगौर पूजा", "hindu", "gangaur"],
  "भूमि पूजा": ["Bhumi Puja", "भूमि पूजा", "hindu", "bhumi-puja"],
  "भूमी पूजा": ["Bhumi Puja", "भूमि पूजा", "hindu", "bhumi-puja"],
  "फूलपाती": ["Phulpati", "फूलपाती", "hindu", "dashain"],
  "घ्यु चाकु खाने दिन": ["Maghe Sankranti", "माघे संक्रान्ति", "hindu", "maghe-sankranti"],
  "दहीचिउरा खाने दिन": ["Maghe Sankranti", "माघे संक्रान्ति", "hindu", "maghe-sankranti"],
  "खीर खाने दिन": ["Kheer Khane Din", "खीर खाने दिन", "hindu", "kheer-khane"],
  "क्वाति खाने दिन": ["Raksha Bandhan", "रक्षाबन्धन", "hindu", "raksha-bandhan"],
  "दर खाने दिन": ["Dar Khane (Teej Eve)", "दर खाने दिन", "hindu", "teej"],
  "धान्यपुर्णिमा": ["Dhanya Purnima", "धान्य पूर्णिमा", "janajati", "udhauli"],
  "ज्यापू दिवस": ["Jyapu Day", "ज्यापू दिवस", "janajati", "udhauli"],
  "ज्यापु दिवस": ["Jyapu Day", "ज्यापू दिवस", "janajati", "udhauli"],
  "कालरात्रि": ["Maha Ashtami", "महा अष्टमी", "hindu", "dashain"],
  "नवरात्र आरम्भ": ["Ghatasthapana", "घटस्थापना", "hindu", "dashain"],
  "पितृ विसर्जन": ["Pitri Visarjan", "पितृ विसर्जन", "hindu", "pitri-paksha"],
  "देवी विसर्जन": ["Devi Visarjan", "देवी विसर्जन", "hindu", "dashain"],
  "ऋषितर्पणी": ["Raksha Bandhan", "रक्षाबन्धन", "hindu", "raksha-bandhan"],
  "गोपाष्टमी": ["Gopashtami", "गोपाष्टमी", "hindu", "gopashtami"],
  "सूर्य षष्ठी": ["Chhath Parva", "छठ पर्व", "hindu", "chhath"],
  "स्कन्द षष्ठी": ["Skanda Shashti", "स्कन्द षष्ठी", "hindu", "skanda-shashti"],
  "सिथि चःह्रे": ["Sithi Chahre", "सिथि चःह्रे", "janajati", "sithi-chahre"],
  "सिथि नख:": ["Sithi Nakha", "सिथि नख:", "janajati", "sithi-chahre"],
  "पाहाँचःह्रे": ["Pahan Chahre", "पाहाँचःह्रे", "janajati", "pahan-chahre"],
  "गथांमुगः चःह्रे": ["Gathamuga Chahre", "गथांमुगः चःह्रे", "janajati", "gathamuga"],
  "य:मरि पुन्हि": ["Dhanya Purnima", "धान्य पूर्णिमा", "janajati", "udhauli"],
  "महा शिवरात्री": ["Maha Shivaratri", "महा शिवरात्रि", "hindu", "maha-shivaratri"],
  "सेना दिवस": ["Army Day", "सेना दिवस", "civic", "army-day"],
  "नेपाली सेना दिवस": ["Army Day", "सेना दिवस", "civic", "army-day"],
  "जेनजी आन्दोलन (शोक बिदा)": ["Gen Z Andolan Mourning", "जेनजी आन्दोलन शोक", "civic", "genz-andolan"],
  "दुर्वाष्टमी": ["Durva Ashtami", "दुर्वाष्टमी", "hindu", "durva-ashtami"],
};

// Prefix matches (feed appends parentheticals, e.g. regions, years).
const PREFIX_MAP = [
  ["फागु पुर्णिमा (पहाडी", ["Holi (Hills)", "होली (पहाड)", "hindu", "holi"]],
  ["फागु पुर्णिमा (तराइ", ["Holi (Terai)", "होली (तराई)", "hindu", "holi"]],
  ["फागु पुर्णिमा (तराई", ["Holi (Terai)", "होली (तराई)", "hindu", "holi"]],
  ["नयाँ वर्ष", ["Nepali New Year", "नयाँ वर्ष", "civic", "new-year"]],
  ["हरितालिका तीज", ["Haritalika Teej", "हरितालिका तीज", "hindu", "teej"]],
  ["गाैरा पर्व", ["Gaura Festival", "गौरा पर्व", "janajati", "gaura"]],
  ["गौरा सप्तमी", ["Gaura Saptami", "गौरा सप्तमी", "janajati", "gaura"]],
  ["मातातीर्थ औंसी", ["Mata Tirtha Aunsi", "मातातीर्थ औंसी", "hindu", "mata-tirtha-aunsi"]],
  ["बाला चतुर्दशी", ["Bala Chaturdashi", "बाला चतुर्दशी", "hindu", "bala-chaturdashi"]],
  ["सरस्वती पूजा", ["Saraswati Puja", "सरस्वती पूजा", "hindu", "saraswati-puja"]],
  ["जितियापर्व", ["Jitiya Parva", "जितिया पर्व", "janajati", "jitiya"]],
  ["अन्तर्राष्ट्रिय नारी", ["Women's Day", "नारी दिवस", "civic", "womens-day"]],
  ["नेपाल सम्वत", ["Nepal Sambat New Year", "नेपाल संवत् नयाँ वर्ष", "janajati", "nepal-sambat"]],
];

// Skipped by design (routine vrats, sankrantis, shraddhas, saint
// jayantis, valley-only jatras, international days). Matched as
// substring — keep entries specific enough to never catch a mapped name.
const SKIP = [
  "व्रत", "संक्रान्ति", "सङ्क्रान्ति", "श्राद्ध", "जयन्ती", "जन्मजयन्ती",
  "विश्व", "अन्तर्राष्ट्रिय", "राष्ट्रिय", "तिहार बिदा", "तिहार  बिदा",
  "दशैं विदा", "उपत्यका", "काठमाडौं", "काठमाडौँ", "बागमती", "सेतो मच्छिन्द्र",
  "रातो मच्छिन्द्र", "जात्रा", "मेला समाप्ती", "स्नान", "दक्षिणायन", "प्रणय",
  "गोरखकाली", "गोरखनाथ", "मातातीर्थ", "औंसी (आमाको", "तुल", "वैष्णव", "वैश्णव",
  "स्मार्त", "शशिधर", "मोतीराम", "भानु", "लक्ष्मीप्रसाद", "चित्तधर", "निम्बार्क",
  "रामानुज", "वल्लभ", "कवीर", "कल्की", "कुर्म", "वराह", "वामन", "दत्तात्रेय",
  "नरसिंह", "नृसिंह", "परशुराम", "मत्स्य", "धनवन्तरी", "व्यास", "तुलसीदास",
  "फाल्गुनन्द", "षडानन्द", "शनि", "गुंला", "गुंला", "मतयाः", "रोपाईं", "सिलाचःह्रे",
  "माझी", "सूर्य पूजा", "राधा", "सीता", "तुलसी", "महाकवि", "महाकवी", "कुम्भ",
  "सांस्कृतिक", "स्वयंस", "सूचना", "टेलिभिजन", "रेडक्रस", "कविता", "पशु", "खाद्य",
  "शिक्षक", "सिमसार", "बेपत्ता", "दर्शनशास्त्र", "शान्ति", "अग्रज", "विद्या",
  "मित्रत", "हुलाक", "फोटोग्राफी", "मानसिक", "रक्तदाता", "मुख", "हाँसा",
  "हेपाटाइटिस", "शिक्षा", "नर्स", "मर्याद", "विज्ञान", "भाक्का", "गरिबी",
  "सांकेत", "मूर्ख", "क्यान्सर", "दृष्टि", "रेबिज", "दर्शन", "फिजियो", "बाघ",
  "क्षयरोग", "आप्रवा", "आणविक", "अहिंसा", "धनु", "द्वादशी", "त्रयोदशी",
  "चतुर्दशी", "तृतीया", "सप्तमी", "चतुर्थी", "एकादशी", "पूर्णिमा", "औंसी",
  "अमावस्या", "अष्टमी", "नवमी", "पञ्चमी", "द्वादशी", "प्रदोष", "मंगलचौथी",
  "संकष्टी", "षट्तिला", "मोहिनी", "योगिनी", "रमा", "वरुथिनी", "बरुथिनी",
  "कामिका", "कामदा", "पुत्रदा", "पापमोच", "पापांकुशा", "सफला", "मोक्षदा",
  "निर्जला", "अपरा", "अजा", "इन्दिरा", "उत्पतिका", "आमलकी", "विजया एकादशी",
  "वसन्तपञ्चमी", "बैकुण्ठ", "भिष्म", "भीमा", "हरिपरिवर्तिनी", "हरिबोधिनी",
  "हरिशयनी", "महागुरु", "महाकाली", "महालक्ष्मी", "कुष्मान्ड", "गङ्गा",
  "उपचार", "इन्टरनेट", "राष्ट्रसंघ", "संगीत", "भेदभाव", "न्याय", "निर्वाचन",
  "वास्तु", "लुतो", "उत्तरायण", "तिलकुन्द", "सुखरात्री", "किराँत समाज",
  "संस्कृत", "बीतक", "गौरव यात्रा", "निर्दोष", "तेल लगाउने", "मेला", "दीपदान",
  "SEE", "ज्या:", "सकिमना", "ज्यापुन्ही", "ग्रहण", "भूकम्प", "भुकम्प",
  "आवासीय", "छन्द", "पोशाक", "कानुन", "कानून", "निजामती", "सामाजिक कार्य",
  "ज्योतिष दिवस", "अरनिको", "2082-", "बुधाष्टमी", "स्मृति", "महोत्सव",
  "ज्योतिष संघ", "ज्योतिष परिषद",
];

// ─── Engine (same table + anchor as src/lib/nepali-date.ts) ──────────
function loadTable() {
  const src = readFileSync(join(ROOT, "src/lib/nepali-date.ts"), "utf8");
  const table = {};
  for (const m of src.matchAll(/^\s*(\d{4}): \[([\d, ]+)\]/gm)) {
    table[Number(m[1])] = m[2].split(",").map(Number);
  }
  if (!table[2083]) throw new Error("engine table parse failed");
  return table;
}

function adToBs(y, m, d, BS) {
  let diff = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1943, 3, 14)) / 86400000);
  let by = 2000, bm = 1, bd = 1 + diff;
  while (bd > BS[by][bm - 1]) { bd -= BS[by][bm - 1]; bm++; if (bm > 12) { bm = 1; by++; } }
  while (bd < 1) { bm--; if (bm < 1) { bm = 12; by--; } bd += BS[by][bm - 1]; }
  return [by, bm, bd];
}

// Existing coverage: Samiti (nameEn + ad) and Lumbini holidays.
function loadCoverage() {
  const samiti = [];
  const ssrc = readFileSync(join(ROOT, "src/lib/festivals-2083.ts"), "utf8");
  for (const m of ssrc.matchAll(/nameEn: "(.*?)",[\s\S]*?ad: \[(\d+), (\d+), (\d+)\]/g)) {
    samiti.push({ nameEn: m[1], iso: `${m[2]}-${m[3].padStart(2, "0")}-${m[4].padStart(2, "0")}` });
  }
  const holidays = [];
  for (const f of ["src/lib/public-holidays-2026.ts", "src/lib/public-holidays-2027.ts"]) {
    const hsrc = readFileSync(join(ROOT, f), "utf8");
    for (const m of hsrc.matchAll(/nameEn: "(.*?)",[\s\S]*?ad: \[(\d+), (\d+), (\d+)\]/g)) {
      holidays.push({ nameEn: m[1], iso: `${m[2]}-${m[3].padStart(2, "0")}-${m[4].padStart(2, "0")}` });
    }
  }
  return { samiti, holidays };
}

const STOP = new Set("subha sri shree parva puja festival day dibas diwas jayanti tihar tika happy merry national public holiday".split(" "));
const tokens = (s) => new Set(s.toLowerCase().split(/[^a-z]+/).filter((w) => w && !STOP.has(w)));
function sameFestival(a, b) {
  const fa = tokens(a), fb = tokens(b);
  for (const w of fa) if (fb.has(w)) return true;
  return false;
}

function slugify(en, bsYear) {
  return en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + bsYear;
}

// ─── Main ────────────────────────────────────────────────────────────
const BS = loadTable();
const { samiti, holidays } = loadCoverage();
const raw = readFileSync(ICS_PATH, "utf8");
// Unfold ICS line folding (CRLF + single space) BEFORE parsing.
const ics = raw.replace(/\r?\n[ \t]/g, "");

const byBsYear = {};
const slugCounts = new Map();
let kept = 0, skipped = 0, unmapped = [];
const seen = new Set(); // iso|nameEn collapse
for (const chunk of ics.split("BEGIN:VEVENT").slice(1)) {
  const dt = chunk.match(/DTSTART[^:]*:(\d{4})(\d{2})(\d{2})/);
  const sum = chunk.match(/SUMMARY[^:]*:(.*)/);
  if (!dt || !sum) continue;
  const summary = sum[1].trim().replace(/\s+/g, " ");
  const iso = `${dt[1]}-${dt[2]}-${dt[3]}`;

  let meta = NAME_MAP[summary];
  if (!meta) {
    const hit = PREFIX_MAP.find(([p]) => summary.startsWith(p));
    if (hit) meta = hit[1];
  }
  if (!meta) {
    if (SKIP.some((s) => summary.includes(s))) { skipped++; continue; }
    unmapped.push(`${iso} :: ${summary}`);
    continue;
  }
  const [nameEn, nameNe, tradition, group] = meta;
  if (seen.has(`${iso}|${nameEn}`)) continue;
  seen.add(`${iso}|${nameEn}`);
  if (samiti.some((s) => s.iso === iso && sameFestival(nameEn, s.nameEn))) continue;
  if (holidays.some((h) => h.iso === iso && sameFestival(nameEn, h.nameEn))) continue;

  const bs = adToBs(Number(dt[1]), Number(dt[2]), Number(dt[3]), BS);
  if (bs[0] === 2083) continue; // Samiti file owns 2083
  // Slug uniqueness per (name, BS year): same observance can fall on two
  // AD dates (Smarta vs Vaishnav) or repeat (Maghe food-day rows).
  const base = slugify(nameEn, bs[0]);
  const n = (slugCounts.get(base) ?? 0) + 1;
  slugCounts.set(base, n);
  const key = n === 1 ? base : `${base}-${n}`;
  (byBsYear[bs[0]] ??= []).push({
    slug: key, nameEn, nameNe, tradition, group,
    bs, ad: [Number(dt[1]), Number(dt[2]), Number(dt[3])],
  });
  kept++;
}

if (unmapped.length) {
  console.log(`UNMAPPED (${unmapped.length}) — add to NAME_MAP or SKIP, never guess:`);
  const counts = {};
  for (const u of unmapped) counts[u.split(" :: ")[1]] = (counts[u.split(" :: ")[1]] || 0) + 1;
  for (const [n, c] of Object.entries(counts).sort((a, b) => b[1] - a[1])) console.log(`  ${c}x ${n}`);
  process.exit(1);
}

for (const [year, rows] of Object.entries(byBsYear).sort()) {
  rows.sort((a, b) => a.bs[1] - b.bs[1] || a.bs[2] - b.bs[2]);
  const body = rows.map((r) =>
    `  {\n    slug: "${r.slug}", group: "${r.group}",\n    nameEn: "${r.nameEn}", nameNe: "${r.nameNe}",\n    tradition: "${r.tradition}", bs: [${r.bs.join(", ")}], ad: [${r.ad.join(", ")}],\n    contextEn: "",\n    contextNe: "",\n  },`).join("\n");
  const out = `/**
 * Festivals of BS ${year} — imported from the Hamro Patro-based community
 * feed (shresthasushil NepaliEvents.ics), major public observances only.
 * Routine vrats, sankrantis, shraddhas, saint jayantis, valley-only jatras
 * and international days are skipped by design.
 *
 * Regenerate with: node scripts/fetch-nepali-events.mjs [ics-path] --write
 *
 * Conventions match festivals-2083.ts, except context lines are empty:
 * one-line writeups stay human-written per year. The Samiti file owns 2083;
 * this importer never emits 2083 rows.
 */
import type { FestivalEntry } from "./festivals-2083";

export const FESTIVALS_${year}: FestivalEntry[] = [
${body}
];
`;
  const dest = join(ROOT, `src/lib/festivals-${year}.ts`);
  const prev = existsSync(dest) ? readFileSync(dest, "utf8") : null;
  if (prev !== out) {
    console.log(`${year}: ${prev ? "UPDATE" : "NEW"} (${rows.length} rows)${WRITE ? " — written" : " — preview only"}`);
    if (WRITE) writeFileSync(dest, out);
  } else {
    console.log(`${year}: unchanged (${rows.length} rows)`);
  }
}
console.log(`kept ${kept}, skipped-by-design ${skipped}`);
