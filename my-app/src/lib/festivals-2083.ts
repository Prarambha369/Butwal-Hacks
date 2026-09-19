/**
 * Festivals of BS 2083 — seeded from the Nepal Panchanga Nirnayak
 * Samiti's official patro (via the Nepal Gazette 2083 holiday notice,
 * Ministry of Home Affairs, Falgun 18, 2082) and cross-checked against
 * Hamro Patro, Nepali Patro, and Rat32 before going live.
 *
 * Conventions:
 * - `bs` is authoritative; `ad` must equal the engine conversion
 *   (asserted in __tests__/festivals-2083.test.ts — a typo fails the build).
 * - `tradition`: hindu | buddhist | janajati | civic | christian.
 * - `tithi` is included only where a Samiti-aligned source states it;
 *   never guessed.
 * - One entry per observance day (multi-day festivals = multiple rows
 *   sharing a `group` slug, so Tihar's 5 consecutive days are explicit).
 * - Next year = a new file (festivals-2084.ts). Never edit this file's
 *   dates — festival pages are permanent URLs.
 */

export type FestivalTradition = "hindu" | "buddhist" | "janajati" | "civic" | "christian";

export interface FestivalEntry {
  /** Stable per-observance id, e.g. "vijaya-dashami". */
  slug: string;
  /** Groups multi-day observances, e.g. "dashain", "tihar". */
  group: string;
  nameEn: string;
  nameNe: string;
  tradition: FestivalTradition;
  /** [BS year, month, day] — authoritative. */
  bs: [number, number, number];
  /** [AD year, month, day] — must match engine conversion (tested). */
  ad: [number, number, number];
  /** Lunar tithi, only when sourced (e.g. "Pratipada", "Purnima"). */
  tithi?: string;
  /** One line of context. Plain words, no grandeur. */
  contextEn: string;
  contextNe: string;
  /** Samiti muhurat where announced (e.g. tika sahit). */
  muhurat?: string;
  publicHoliday?: boolean;
}

export const FESTIVALS_2083: FestivalEntry[] = [
  // ─── Baisakh ───
  {
    slug: "nepali-new-year-2083", group: "new-year",
    nameEn: "Nepali New Year", nameNe: "नयाँ वर्ष",
    tradition: "civic", bs: [2083, 1, 1], ad: [2026, 4, 14],
    contextEn: "First day of 2083. New year, same you, fresh patro.",
    contextNe: "२०८३ को पहिलो दिन। नयाँ वर्ष, नयाँ पात्रो।",
    publicHoliday: true,
  },
  {
    slug: "buddha-jayanti-2083", group: "buddha-jayanti",
    nameEn: "Buddha Jayanti", nameNe: "बुद्ध जयन्ती",
    tradition: "buddhist", bs: [2083, 1, 18], ad: [2026, 5, 1],
    tithi: "Purnima",
    contextEn: "Birth, enlightenment, and passing of the Buddha, on one full-moon day. Ubhauli (Kiranti) falls the same day.",
    contextNe: "बुद्धको जन्म, बोध र महापरिनिर्वाण एउटै पूर्णिमामा। उभौली पनि आजै।",
    publicHoliday: true,
  },
  // ─── Bhadra ───
  {
    slug: "raksha-bandhan-2083", group: "raksha-bandhan",
    nameEn: "Raksha Bandhan (Janai Purnima)", nameNe: "रक्षाबन्धन (जनै पूर्णिमा)",
    tradition: "hindu", bs: [2083, 5, 12], ad: [2026, 8, 28],
    tithi: "Purnima",
    contextEn: "Sacred thread day. Brothers and sisters tie protection on each other's wrists.",
    contextNe: "डोरो बाँध्ने दिन। दाजुभाइ-दिदीबहिनीबीच रक्षाको धागो।",
    publicHoliday: true,
  },
  {
    slug: "krishna-janmashtami-2083", group: "krishna-janmashtami",
    nameEn: "Krishna Janmashtami", nameNe: "कृष्ण जन्माष्टमी",
    tradition: "hindu", bs: [2083, 5, 19], ad: [2026, 9, 4],
    tithi: "Ashtami",
    contextEn: "Midnight birth of Krishna. Fasts break after the night puja.",
    contextNe: "कृष्णको मध्यरात जन्म। राति पूजा पछि व्रत खोलिन्छ।",
    publicHoliday: true,
  },
  {
    slug: "haritalika-teej-2083", group: "teej",
    nameEn: "Haritalika Teej", nameNe: "हरितालिका तीज",
    tradition: "hindu", bs: [2083, 5, 29], ad: [2026, 9, 14],
    tithi: "Tritiya",
    contextEn: "Women fast and dance in red for marital bliss and Shiva-Parvati's union. Dar Khane the night before.",
    contextNe: "महिलाहरू रातोमा नाच्छन्, व्रत बस्छन्। अघिल्लो रात दर खाने।",
    publicHoliday: true,
  },
  {
    slug: "rishi-panchami-2083", group: "teej",
    nameEn: "Rishi Panchami", nameNe: "ऋषि पञ्चमी",
    tradition: "hindu", bs: [2083, 5, 30], ad: [2026, 9, 15],
    tithi: "Panchami",
    contextEn: "Day after Teej: ritual cleansing and homage to the seven sages.",
    contextNe: "तीजको भोलिपल्ट: शुद्धीकरण र सप्तऋषि पूजा।",
  },
  // ─── Ashwin ───
  {
    slug: "bishwakarma-puja-2083", group: "sankranti",
    nameEn: "Bishwakarma Puja (Kanya Sankranti)", nameNe: "विश्वकर्मा पूजा (कन्या संक्रान्ति)",
    tradition: "hindu", bs: [2083, 6, 1], ad: [2026, 9, 17],
    contextEn: "Tools and machines get tika. Mechanics, drivers, and makers honor the divine engineer.",
    contextNe: "औजार र मेसिनको पूजा। बनाउनेहरूले दिव्य इन्जिनियर सम्झन्छन्।",
  },
  {
    slug: "constitution-day-2083", group: "constitution-day",
    nameEn: "Constitution Day (Sambidhan Diwas)", nameNe: "संविधान दिवस",
    tradition: "civic", bs: [2083, 6, 3], ad: [2026, 9, 19],
    contextEn: "Nepal's constitution day. Parades, speeches, and a day off.",
    contextNe: "नेपालको संविधान दिवस। परेड, भाषण र बिदा।",
    publicHoliday: true,
  },
  {
    slug: "ghatasthapana-2083", group: "dashain",
    nameEn: "Ghatasthapana", nameNe: "घटस्थापना",
    tradition: "hindu", bs: [2083, 6, 25], ad: [2026, 10, 11],
    tithi: "Pratipada",
    contextEn: "Day 1 of 15: barley seeds (jamara) are sown and the kalash installed. Dashain begins.",
    contextNe: "१५ दिने दशैंको दिन १: जमरा छरिन्छ, कलश स्थापना हुन्छ।",
    publicHoliday: true,
  },
  {
    slug: "phulpati-2083", group: "dashain",
    nameEn: "Phulpati", nameNe: "फूलपाती",
    tradition: "hindu", bs: [2083, 6, 31], ad: [2026, 10, 17],
    tithi: "Saptami",
    contextEn: "Day 7: sacred flowers and jamara carried to Hanuman Dhoka in procession.",
    contextNe: "दिन ७: फूलपाती हनुमानढोका लगिन्छ।",
    publicHoliday: true,
  },
  // ─── Kartik ───
  {
    slug: "maha-ashtami-2083", group: "dashain",
    nameEn: "Maha Ashtami", nameNe: "महा अष्टमी",
    tradition: "hindu", bs: [2083, 7, 1], ad: [2026, 10, 18],
    tithi: "Ashtami",
    contextEn: "Day 8: Kaal Ratri, the fierce night of Durga worship.",
    contextNe: "दिन ८: कालरात्रि, दुर्गाको उग्र पूजा।",
    publicHoliday: true,
  },
  {
    slug: "maha-navami-2083", group: "dashain",
    nameEn: "Maha Navami", nameNe: "महा नवमी",
    tradition: "hindu", bs: [2083, 7, 3], ad: [2026, 10, 20],
    tithi: "Navami",
    contextEn: "Day 9: last night of Navaratri. Vehicles and tools get blessed too.",
    contextNe: "दिन ९: नवरात्रिको अन्तिम रात। सवारी र औजारको पनि पूजा।",
    publicHoliday: true,
  },
  {
    slug: "vijaya-dashami-2083", group: "dashain",
    nameEn: "Vijaya Dashami (Tika Day)", nameNe: "विजया दशमी (टीकाको दिन)",
    tradition: "hindu", bs: [2083, 7, 4], ad: [2026, 10, 21],
    tithi: "Dashami",
    contextEn: "Day 10, the heart of Dashain: elders place tika and jamara, blessings flow downhill for days.",
    contextNe: "दिन १०, दशैंको मुटु: ठूलाले टीका-जमरा लगाइदिन्छन्, आशिर्वाद बग्छ।",
    muhurat: "11:39 AM NST (tika sahit, per Samiti)",
    publicHoliday: true,
  },
  {
    slug: "kojagrat-purnima-2083", group: "dashain",
    nameEn: "Kojagrat Purnima", nameNe: "कोजाग्रत पूर्णिमा",
    tradition: "hindu", bs: [2083, 7, 8], ad: [2026, 10, 25],
    tithi: "Purnima",
    contextEn: "Day 15: Dashain ends under the full moon. Tradition says Lakshmi visits those who stay awake.",
    contextNe: "दिन १५: पूर्णिमामा दशैं सकिन्छ।",
    publicHoliday: true,
  },
  {
    slug: "kag-tihar-2083", group: "tihar",
    nameEn: "Kag Tihar", nameNe: "काग तिहार",
    tradition: "hindu", bs: [2083, 7, 21], ad: [2026, 11, 7],
    contextEn: "Day 1 of 5: crows, messengers of Yama, get the first food.",
    contextNe: "५ दिने तिहारको दिन १: कागलाई पहिलो खाना।",
    publicHoliday: true,
  },
  {
    slug: "kukur-tihar-2083", group: "tihar",
    nameEn: "Kukur Tihar", nameNe: "कुकुर तिहार",
    tradition: "hindu", bs: [2083, 7, 22], ad: [2026, 11, 8],
    contextEn: "Day 2: dogs garlanded and feasted, street dogs included. The most photographed day.",
    contextNe: "दिन २: कुकुरलाई माला र भोज। सबैभन्दा धेरै फोटो खिचिने दिन।",
    publicHoliday: true,
  },
  {
    slug: "laxmi-puja-2083", group: "tihar",
    nameEn: "Laxmi Puja", nameNe: "लक्ष्मी पूजा",
    tradition: "hindu", bs: [2083, 7, 22], ad: [2026, 11, 8],
    contextEn: "Night of lights: homes glow with oil lamps for the goddess of wealth. Overlaps Kukur day this year (two tithis, one solar day).",
    contextNe: "बत्तीको रात: लक्ष्मीका लागि दियो। यो वर्ष कुकुर तिहारसँग जुधेको।",
    publicHoliday: true,
  },
  {
    slug: "gai-tihar-mha-puja-2083", group: "tihar",
    nameEn: "Gai Tihar & Mha Puja", nameNe: "गाई तिहार र म्ह पूजा",
    tradition: "hindu", bs: [2083, 7, 23], ad: [2026, 11, 9],
    contextEn: "Cows honored in the morning; Newar Mha Puja worships the self in the evening.",
    contextNe: "बिहान गाई पूजा, बेलुका म्ह पूजा।",
    publicHoliday: true,
  },
  {
    slug: "bhai-tika-2083", group: "tihar",
    nameEn: "Bhai Tika", nameNe: "भाइ टीका",
    tradition: "hindu", bs: [2083, 7, 25], ad: [2026, 11, 11],
    contextEn: "Day 5, the finale: sisters place seven-color tika on brothers for protection and long life.",
    contextNe: "दिन ५, समापन: दिदीबहिनीले दाजुभाइलाई सप्तरंगी टीका।",
    muhurat: "11:39 AM NST (per Samiti)",
    publicHoliday: true,
  },
  {
    slug: "chhath-2083", group: "chhath",
    nameEn: "Chhath Parva", nameNe: "छठ पर्व",
    tradition: "hindu", bs: [2083, 7, 29], ad: [2026, 11, 15],
    contextEn: "Sun worship at riverbanks at dawn and dusk. Terai's biggest festival.",
    contextNe: "नदी किनारमा सूर्य पूजा। तराईको ठूलो चाड।",
    publicHoliday: true,
  },
  // ─── Poush ───
  {
    slug: "dhanya-purnima-udhauli-2083", group: "udhauli",
    nameEn: "Dhanya Purnima (Udhauli / Yomari Punhi)", nameNe: "धान्य पूर्णिमा (उधौली / यःमरि पुन्हि)",
    tradition: "janajati", bs: [2083, 9, 9], ad: [2026, 12, 24],
    tithi: "Purnima",
    contextEn: "Kiranti Udhauli migration festival meets Newar Yomari Punhi: harvest, yomari, Jyapu Day.",
    contextNe: "उधौली र यःमरि पुन्हि एकै दिन: बाली, यःमरि, ज्यापू दिवस।",
    publicHoliday: true,
  },
  {
    slug: "christmas-2083", group: "christmas",
    nameEn: "Christmas Day", nameNe: "क्रिसमस डे",
    tradition: "christian", bs: [2083, 9, 10], ad: [2026, 12, 25],
    contextEn: "Public holiday for Christians in Nepal.",
    contextNe: "नेपालका क्रिस्चियनका लागि सार्वजनिक बिदा।",
    publicHoliday: true,
  },
  {
    slug: "tamu-lhosar-2083", group: "tamu-lhosar",
    nameEn: "Tamu Lhosar", nameNe: "तमु ल्होसार",
    tradition: "janajati", bs: [2083, 9, 15], ad: [2026, 12, 30],
    contextEn: "Gurung new year: feasts, dances, and homecomings in the hills.",
    contextNe: "गुरुङ नयाँ वर्ष: भोज, नाच र घर फर्काइ।",
    publicHoliday: true,
  },
  // ─── Magh ───
  {
    slug: "prithvi-jayanti-2083", group: "prithvi-jayanti",
    nameEn: "Prithvi Jayanti (National Unity Day)", nameNe: "पृथ्वी जयन्ती (राष्ट्रिय एकता दिवस)",
    tradition: "civic", bs: [2083, 9, 27], ad: [2027, 1, 11],
    contextEn: "Birthday of Prithvi Narayan Shah, unifier of Nepal.",
    contextNe: "नेपाल एकीकरणकर्ता पृथ्वीनारायण शाहको जन्मदिन।",
    publicHoliday: true,
  },
  {
    slug: "maghe-sankranti-2083", group: "maghe-sankranti",
    nameEn: "Maghe Sankranti (Maghi)", nameNe: "माघे संक्रान्ति (माघी)",
    tradition: "hindu", bs: [2083, 10, 1], ad: [2027, 1, 15],
    contextEn: "Sun enters Capricorn; winter's back breaks. Tharu Maghi new year, til-laddu and yam day. River baths at dawn.",
    contextNe: "सूर्य मकरमा; जाडोको ढाड भाँचिन्छ। थारू नयाँ वर्ष, तिल-लड्डु र तरुलको दिन।",
    publicHoliday: true,
  },
  {
    slug: "swasthani-brata-start-2083", group: "swasthani",
    nameEn: "Swasthani Brata Begins", nameNe: "स्वस्थानी व्रत सुरु",
    tradition: "hindu", bs: [2083, 10, 8], ad: [2027, 1, 22],
    contextEn: "Month-long telling of the Swasthani goddess begins; fasting households gather nightly.",
    contextNe: "महिनाभरि स्वस्थानी कथा सुरु; व्रतालु घरमा राति भेला।",
  },
  {
    slug: "martyrs-day-2083", group: "martyrs-day",
    nameEn: "Martyrs' Day (Shaheed Diwas)", nameNe: "शहीद दिवस",
    tradition: "civic", bs: [2083, 10, 16], ad: [2027, 1, 30],
    contextEn: "For the four martyrs. Quiet wreaths at Shaheed Gate.",
    contextNe: "चार शहीदका लागि। शहीद गेटमा मौन माल्यार्पण।",
    publicHoliday: true,
  },
  {
    slug: "sonam-lhosar-2083", group: "sonam-lhosar",
    nameEn: "Sonam Lhosar", nameNe: "सोनाम ल्होसार",
    tradition: "buddhist", bs: [2083, 10, 24], ad: [2027, 2, 7],
    contextEn: "Tamang new year: dumplings, dances, monastery crowds.",
    contextNe: "तामाङ नयाँ वर्ष: मोमो, नाच, गुम्बामा भीड।",
    publicHoliday: true,
  },
  // ─── Falgun ───
  {
    slug: "prajatantra-diwas-2083", group: "prajatantra-diwas",
    nameEn: "Prajatantra Diwas (Democracy Day)", nameNe: "प्रजातन्त्र दिवस",
    tradition: "civic", bs: [2083, 11, 7], ad: [2027, 2, 19],
    contextEn: "Fall of the Ranas, dawn of democracy. Parades at Tundikhel.",
    contextNe: "राणा शासनको अन्त्य, प्रजातन्त्रको बिहान। टुँडिखेलमा परेड।",
    publicHoliday: true,
  },
  {
    slug: "maha-shivaratri-2083", group: "maha-shivaratri",
    nameEn: "Maha Shivaratri", nameNe: "महा शिवरात्रि",
    tradition: "hindu", bs: [2083, 11, 22], ad: [2027, 3, 6],
    contextEn: "The great night of Shiva: fasting, vigils, and Pashupatinath packed shoulder to shoulder. Also Army Day.",
    contextNe: "शिवको महान रात: व्रत, जाग्राम, पशुपतिनाथमा भीड। सेना दिवस पनि।",
    publicHoliday: true,
  },
  {
    slug: "womens-day-2083", group: "womens-day",
    nameEn: "International Women's Day", nameNe: "अन्तर्राष्ट्रिय नारी दिवस",
    tradition: "civic", bs: [2083, 11, 24], ad: [2027, 3, 8],
    contextEn: "Rallies and programs nationwide; public holiday for women.",
    contextNe: "देशभर र्‍याली र कार्यक्रम; महिलाका लागि सार्वजनिक बिदा।",
    publicHoliday: true,
  },
  {
    slug: "gyalpo-lhosar-2083", group: "gyalpo-lhosar",
    nameEn: "Gyalpo Lhosar", nameNe: "ग्याल्पो ल्होसार",
    tradition: "buddhist", bs: [2083, 11, 25], ad: [2027, 3, 9],
    contextEn: "Sherpa and high-Himalayan new year. Khada scarves and chang toasts.",
    contextNe: "शेर्पा नयाँ वर्ष। खदा र छ्याङ।",
    publicHoliday: true,
  },
  // ─── Chaitra ───
  {
    slug: "holi-hills-2083", group: "holi",
    nameEn: "Holi (Hills & Kathmandu)", nameNe: "होली (पहाड)",
    tradition: "hindu", bs: [2083, 12, 7], ad: [2027, 3, 21],
    tithi: "Purnima",
    contextEn: "Colors in the hills a day before the Terai. Abir, water, strangers turned friends.",
    contextNe: "तराईभन्दा एक दिन अघि पहाडमा रङ। अबिर, पानी, अपरिचित साथी।",
    publicHoliday: true,
  },
  {
    slug: "holi-terai-2083", group: "holi",
    nameEn: "Holi (Terai)", nameNe: "होली (तराई)",
    tradition: "hindu", bs: [2083, 12, 8], ad: [2027, 3, 22],
    tithi: "Purnima",
    contextEn: "Terai plays Holi a day later, on Fagu Purnima proper.",
    contextNe: "तराईमा एक दिन पछि, फागु पूर्णिमामै होली।",
    publicHoliday: true,
  },
];

export function getFestival(slug: string, year = 2083) {
  return FESTIVALS_2083.filter((f) => f.bs[0] === year).find((f) => f.slug === slug) ?? null;
}

export function getFestivalsByGroup(group: string, year = 2083) {
  return FESTIVALS_2083.filter((f) => f.bs[0] === year && f.group === group);
}

/** Bilingual tradition labels + dot colors, shared by pages and calendar. */
export const TRADITION_META: Record<FestivalTradition, { en: string; ne: string; dot: string }> = {
  hindu: { en: "Hindu", ne: "हिन्दू", dot: "bg-primary-red" },
  buddhist: { en: "Buddhist", ne: "बौद्ध", dot: "bg-status-yellow" },
  janajati: { en: "Janajati", ne: "जनजाति", dot: "bg-status-green" },
  civic: { en: "Civic", ne: "नागरिक", dot: "bg-status-blue" },
  christian: { en: "Christian", ne: "क्रिस्चियन", dot: "bg-status-teal" },
};
