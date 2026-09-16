"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useLanguage } from '@/components/language-provider';
import { t } from '@/lib/i18n';

const sitemapGroups = [
  {
    labelKey: 'footer.events_projects',
    links: [
      { nameKey: 'footer.all_events', href: '/events' },
      { nameKey: 'footer.event_list', href: '/events/list' },
      { nameKey: 'footer.event_gallery', href: '/gallery' },
      { nameKey: 'footer.featured_projects', href: '/projects' },
      { nameKey: 'footer.initiatives', href: '/initiatives' },
    ],
  },
  {
    labelKey: 'footer.community',
    links: [
      { nameKey: 'footer.community_hub', href: '/community' },
      { nameKey: 'footer.explore_members', href: '/explore' },
      { nameKey: 'footer.chapters', href: '/chapters' },
      { nameKey: 'footer.opportunities', href: '/opportunities' },
      { nameKey: 'footer.sponsor_portal', href: '/portal/sponsors' },
    ],
  },
  {
    labelKey: 'footer.learn_resources',
    links: [
      { nameKey: 'footer.blog_insights', href: '/blog' },
      { nameKey: 'footer.resources_page', href: '/resources' },
      { nameKey: 'footer.documentation', href: '/docs' },
      { nameKey: 'footer.donors', href: '/donors' },
      { nameKey: 'footer.annual_report', href: '/annual-report' },
    ],
  },
  {
    labelKey: 'footer.about_section',
    links: [
      { nameKey: 'footer.about_us', href: '/about' },
      { nameKey: 'footer.philosophy', href: '/philosophy' },
      { nameKey: 'footer.sponsor_prospectus', href: '/support' },
      { nameKey: 'footer.transparency', href: '/transparency' },
      { nameKey: 'footer.governance', href: '/governance' },
      { nameKey: 'footer.contact_us', href: '/contact' },
    ],
  },
];

function LanguageToggle() {
  const { locale, setLocale } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-w-[44px] min-h-[44px]" />;
  }

  return (
    <button
      onClick={() => setLocale(locale === 'en' ? 'ne' : 'en')}
      className="flex min-w-[44px] min-h-[44px] items-center justify-center rounded-full text-[11px] font-bold tracking-tight text-muted-foreground hover:text-primary hover:bg-surface-hover transition-all duration-300 active:scale-95"
      aria-label={locale === 'en' ? 'Switch to Nepali' : 'Switch to English'}
    >
      {locale === 'en' ? 'EN' : 'ने'}
    </button>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { locale } = useLanguage();

  return (
    <footer className="w-full border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-20 md:px-20">
        {/* Brand Statement */}
        <div className="mb-16 text-center space-y-4">
          <p className="text-2xl md:text-4xl font-bold text-primary">
            {t('footer.brand_statement', locale)}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
            {t('footer.brand_description', locale)}
          </p>
        </div>

        {/* Sitemap Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-10 mb-16">
          {sitemapGroups.map((group) => (
            <div key={group.labelKey} className="space-y-5">
              <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {t(group.labelKey, locale)}
              </h2>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.nameKey}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary-red transition-colors"
                    >
                      {t(link.nameKey, locale)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Brand Mark */}
        <div className="text-center py-12 border-t border-border">
          <span className="font-black text-4xl md:text-6xl tracking-tighter text-primary">
            Butwal<span className="text-primary-red">Hacks</span>
          </span>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-primary-red mt-3">
            {t('footer.ignite_unite_lead', locale)}
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-3">
            <p className="text-xs font-mono text-muted-foreground/60 text-center md:text-left">
              {t('footer.copyright', locale).replace('{year}', String(currentYear))}
            </p>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <LanguageToggle />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6 text-[11px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <Link href="/legal/privacy" className="hover:text-primary-red transition-colors">
              {t('footer.privacy', locale)}
            </Link>
            <Link href="/legal/terms" className="hover:text-primary-red transition-colors">
              {t('footer.terms', locale)}
            </Link>
            <Link href="/cookie-policy" className="hover:text-primary-red transition-colors">
              {t('footer.cookies', locale)}
            </Link>
            <Link href="/sitemap" className="hover:text-primary-red transition-colors">
              {t('footer.sitemap', locale)}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
