/**
 * The homepage FAQ, as i18n keys.
 *
 * Lives here rather than in the client component that renders it so a server
 * component can resolve the same keys for FAQPage JSON-LD. The visible FAQ and
 * the structured data then cannot disagree, which is the whole point: Google
 * requires FAQ markup to match content actually on the page, and a hand-copied
 * list of the same six questions is exactly how that starts to drift.
 */
export const HOME_FAQ_KEYS = [
  "free",
  "who-can-join",
  "donations",
  "volunteer",
  "events",
  "nonprofit-status",
] as const;

export type HomeFaqId = (typeof HOME_FAQ_KEYS)[number];

export const homeFaqEntries = HOME_FAQ_KEYS.map((id) => ({
  id,
  qKey: `home.faq.items.${id}.q`,
  aKey: `home.faq.items.${id}.a`,
}));
