export interface LocalizedText {
  en: string;
  ne: string;
}

export interface EditableKey {
  key: string;
  label: string;
  fallbackKey: string;
}

/** Registry of maintainer-editable copy. Fallbacks are i18n keys (today's site). */
export const EDITABLE_KEYS: EditableKey[] = [
  { key: 'hero.title', label: 'Hero headline', fallbackKey: 'home.hero.title' },
  { key: 'hero.subtext', label: 'Hero subheading', fallbackKey: 'home.hero.subtext' },
  { key: 'contact.final.title', label: 'Finale headline', fallbackKey: 'home.contact.final.title' },
  { key: 'contact.final.subtitle', label: 'Finale subheading', fallbackKey: 'home.contact.final.subtitle' },
];
