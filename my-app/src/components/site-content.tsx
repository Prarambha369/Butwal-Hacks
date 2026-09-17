"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { t } from "@/lib/i18n";
import { getSiteContentValue, type LocalizedText } from "@/lib/actions/site-content";

/**
 * useSiteContent — maintainer-editable copy with i18n fallback.
 * Renders the fallback string instantly, then swaps in the DB value
 * once loaded. Empty table = today's site, exactly.
 */
export function useSiteContent(key: string, fallbackKey: string): string {
  const { locale } = useLanguage();
  const [value, setValue] = useState<LocalizedText | null>(null);

  useEffect(() => {
    let mounted = true;
    getSiteContentValue(key).then((v) => {
      if (mounted) setValue(v);
    }).catch(() => {
      // Fallback copy stays on DB errors
    });
    return () => { mounted = false; };
  }, [key]);

  if (value) return locale === "ne" ? value.ne : value.en;
  return t(fallbackKey, locale);
}
