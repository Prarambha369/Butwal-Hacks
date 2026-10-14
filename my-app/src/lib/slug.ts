/**
 * Slug generation, in one place.
 *
 * Slugs are public URLs (`/events/<slug>`), so the rules are SEO rules, not
 * cosmetics:
 *
 *   - lowercase only. URLs are case-sensitive to servers but not to humans,
 *     so `/events/Daydream` and `/events/daydream` reading as the same page
 *     invites duplicate content and split link equity.
 *   - ASCII only. A slug lands in a URL, a sitemap, and a share sheet. Devanagari
 *     or other non-ASCII characters percent-encode into unreadable URLs, so
 *     they are transliterated where possible and dropped otherwise.
 *   - hyphen-separated, no leading or trailing hyphen. The canonical shape for
 *     words.
 *   - length-capped. Beyond ~80 characters the slug gets truncated mid-word by
 *     browsers and search engines.
 *
 * This module is deliberately pure: `slugify()` touches nothing outside its
 * argument. The database-aware half (`uniqueSlug`) takes an `exists` predicate
 * so it stays testable without a Supabase client, and because collision rules
 * differ per table -- chapters, events, and blog posts each have their own
 * `UNIQUE` column.
 */

/** Longest slug we will emit. Keeps the whole URL readable in a share sheet. */
export const SLUG_MAX_LENGTH = 80;

/**
 * Characters that map to a word boundary in a slug.
 *
 * `&` becomes "and" rather than being dropped, so "Research & Development"
 * becomes `research-and-development` instead of `research-development`, which
 * would read as a different word sequence to a search engine.
 */
const LIGATURES: ReadonlyArray<readonly [RegExp, string]> = [
  [/[&]/g, " and "],
  [/[+]/g, " plus "],
];

/**
 * Best-effort transliteration for the Latin letters that carry diacritics, so
 * "Ramesh Thapa" and "Ramesh Thápá" do not produce two different slugs for what
 * is the same person. Anything outside this table is dropped, not approximated
 * -- a wrong guess is worse than a shorter slug.
 */
const FOLD: Readonly<Record<string, string>> = {
  à: "a", á: "a", â: "a", ã: "a", ä: "a", å: "a", ā: "a", ă: "a", ą: "a",
  æ: "ae",
  ç: "c", ć: "c", č: "c", ĉ: "c", ċ: "c",
  ď: "d", đ: "d",
  è: "e", é: "e", ê: "e", ë: "e", ē: "e", ĕ: "e", ė: "e", ę: "e", ě: "e",
  ĝ: "g", ğ: "g", ġ: "g", ģ: "g",
  ĥ: "h", ħ: "h",
  ì: "i", í: "i", î: "i", ï: "i", ĩ: "i", ī: "i", ĭ: "i", į: "i", ı: "i",
  ĵ: "j",
  ķ: "k",
  ĺ: "l", ļ: "l", ľ: "l", ł: "l",
  ñ: "n", ń: "n", ņ: "n", ň: "n",
  ò: "o", ó: "o", ô: "o", õ: "o", ö: "o", ø: "o", ō: "o", ŏ: "o", ő: "o",
  œ: "oe",
  // ß has no NFD decomposition, so unlike the accented letters above it is not
  // reachable via the combining-mark pass and must be folded explicitly.
  ß: "ss",
  ŕ: "r", ŗ: "r", ř: "r",
  ś: "s", ŝ: "s", ş: "s", š: "s",
  ţ: "t", ť: "t", ŧ: "t",
  ù: "u", ú: "u", û: "u", ü: "u", ũ: "u", ū: "u", ŭ: "u", ů: "u", ű: "u", ų: "u",
  ŵ: "w",
  ý: "y", ÿ: "y", ŷ: "y",
  ź: "z", ż: "z", ž: "z",
};

/**
 * Convert arbitrary text into a URL-safe slug.
 *
 * Returns `""` for input with no slug-safe characters at all -- an emoji-only
 * title, or a title in a script this does not transliterate. Callers must
 * treat that as a failure rather than writing an empty slug, because `""` and
 * `null` are different values in the database and `""` would collide with
 * every other empty slug at the `UNIQUE` index.
 */
export function slugify(input: string): string {
  if (!input) return "";

  let text = input.toLowerCase().normalize("NFD");

  // NFD splits "é" into "e" + combining acute; drop the combining marks so the
  // fold below only sees base letters. Marks alone (no base) are dropped by
  // the same pass.
  text = text.replace(/[̀-ͯ]/g, "");

  for (const [pattern, replacement] of LIGATURES) {
    text = text.replace(pattern, replacement);
  }

  // Devanagari digits are common in Nepali event names ("Hackathon २०७८").
  // Fold them to ASCII digits so the slug is readable rather than dropped.
  text = text
    .replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x0966))
    .replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x0966));

  let out = "";
  for (const ch of text) {
    out += FOLD[ch] ?? ch;
  }

  // Anything left that is not a-z0-9 becomes a hyphen. This removes every other
  // script, punctuation, and symbol in one pass.
  out = out.replace(/[^a-z0-9]+/g, "-");

  // Collapse runs, and trim hyphens the substitution left at both ends.
  out = out.replace(/-+/g, "-").replace(/^-|-$/g, "");

  // Truncate, then re-trim: cutting at 80 can expose a trailing hyphen.
  if (out.length > SLUG_MAX_LENGTH) {
    out = out.slice(0, SLUG_MAX_LENGTH).replace(/-+$/, "");
  }

  return out;
}

/** Longest suffix `uniqueSlug` will try before giving up. */
const MAX_COLLISION_ATTEMPTS = 100;

/**
 * A slug that no existing row holds.
 *
 * Collision resolution appends `-2`, `-3`, ... in the style already used for
 * chapters, so `daydream-butwal`, `daydream-butwal-2`, `daydream-butwal-3`.
 * The counter is bounded: after 100 collisions the input is pathological
 * rather than popular, and an unbounded loop against the database would be a
 * denial-of-service vector on a public signup path.
 *
 * `exists` is expected to resolve true when the candidate is already taken.
 * The base slug is checked first, so an uncolliding title costs exactly one
 * lookup.
 */
export async function uniqueSlug(
  desired: string,
  exists: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(desired);
  if (!base) return "";

  if (!(await exists(base))) return base;

  for (let n = 2; n <= MAX_COLLISION_ATTEMPTS; n++) {
    const suffix = `-${n}`;
    // Keep the suffix when trimming the base so the readable head survives.
    const room = SLUG_MAX_LENGTH - suffix.length;
    const head = base.length > room ? base.slice(0, room).replace(/-+$/, "") : base;
    const candidate = `${head}${suffix}`;
    if (!(await exists(candidate))) return candidate;
  }

  // Exhausted. Every variant is taken, so fall back to something unique rather
  // than returning a slug that would violate the UNIQUE index.
  return `${base}-${Date.now().toString(36)}`;
}