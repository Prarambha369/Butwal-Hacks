"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { t } from "@/lib/i18n";
import { getPublicSiteContent, type LocalizedText } from "@/lib/actions/site-content";

type SiteContentMap = Record<string, LocalizedText | null>;

/**
 * One request per page load, shared by every useSiteContent caller. Each
 * server action is a POST to the page path (which the edge firewall counts
 * toward its per-IP page-request limit), and one call per key sent four per
 * homepage visit. A failed read is not retried automatically: the fallback
 * copy stays, and the next full page load asks again.
 */
let contentRequest: Promise<SiteContentMap> | null = null;
function loadSiteContent(): Promise<SiteContentMap> {
  contentRequest ??= getPublicSiteContent().catch(() => ({}));
  return contentRequest;
}

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
    void loadSiteContent().then((map) => {
      if (mounted) setValue(map[key] ?? null);
    });
    return () => { mounted = false; };
  }, [key]);

  if (value) return locale === "ne" ? value.ne : value.en;
  return t(fallbackKey, locale);
}
