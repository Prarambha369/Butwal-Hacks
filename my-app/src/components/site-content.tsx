"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { t } from "@/lib/i18n";
import { appUrl } from "@/lib/app-origin";
import type { LocalizedText } from "@/lib/site-content-keys";

type SiteContentMap = Record<string, LocalizedText | null>;

/**
 * One request per page load, shared by every useSiteContent caller, to the
 * cached GET /api/site-content (on the app origin from the static marketing
 * site). It replaced a server action, which was a POST to the page path that
 * the edge firewall counted toward its per-IP page-request limit and that a
 * static export cannot include. A failed read is not retried automatically:
 * the fallback copy stays, and the next full page load asks again.
 */
let contentRequest: Promise<SiteContentMap> | null = null;
function loadSiteContent(): Promise<SiteContentMap> {
  contentRequest ??= fetch(appUrl("/api/site-content"))
    .then((res) => (res.ok ? (res.json() as Promise<SiteContentMap>) : {}))
    .catch(() => ({}));
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
