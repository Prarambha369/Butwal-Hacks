/**
 * TrustedBy — left-to-right animated trusted-by social proof section.
 */

"use client";

import { useLanguage } from "@/components/language-provider";
import { t } from "@/lib/i18n";

interface CompanyLogo {
  name: string
  inner: string
  attributes?: Partial<{
    fill: string
    stroke: string
    strokeWidth: string
  }>
}

/* ─── SVG path data (placeholders; replace later with real brand SVGs) ─── */
const companies: CompanyLogo[] = [
  { name: "MLH", inner: `<path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 14h-2V6h2v10z"/>` },
  { name: "HackFoundation (Hack Club)", inner: `<path d="M12 3l8 6v12l-8-6-8 6V9l8-6z"/>` },
  { name: "Nepal Police", inner: `<path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"/>` },
  { name: "Lumbini Lions", inner: `<path d="M12 2l9 5v10l-9 5-9-5V7l9-5z"/>` },
  { name: "Jukebox", inner: `<path d="M12 12a4 4 0 10-4-4 4 4 0 004 4zm7 9H5a3 3 0 010-6h14a3 3 0 010 6z"/>` },
  { name: "Notion KEC", inner: `<path d="M6 3h12v18H6V3zm2 4h8v2H8V7z"/>` },
  { name: "Gnome Nepal", inner: `<path d="M7 7h10v10H7V7zm2 2h6v6H9V9z"/>` },
  { name: "Tekgurkha LLC", inner: `<path d="M4 12l8-8 8 8-8 8-8-8z"/>` },
  { name: "GDG Nepal", inner: `<path d="M12 2l10 6-10 6L2 8l10-6zm0 10l10 6-10 6-10-6 10-6z"/>` },
  { name: "Lumbini Province Police", inner: `<path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"/>` },
  { name: "Sagar Dhakal", inner: `<path d="M12 2l9 7-9 13L3 9l9-7z"/>` },
  { name: "iCan Education", inner: `<path d="M4 6h16v2H4V6zm2 4h12v10H6V10z"/>` },
  { name: "GitHub Education", inner: `<path d="M8 2l4 2 4-2 2 4-2 4-4-2-4 2-2-4 2-4z"/>` },
  { name: ".xyz Domains", inner: `<path d="M4 6h16v4H4V6zm0 8h16v4H4v-4z"/>` },
  { name: "ElevenLabs", inner: `<path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1 6h2v8h-2V8z"/>` },
  { name: "Google Gemini", inner: `<path d="M4 8l8-6 8 6v8l-8 6-8-6V8zm8-3a3 3 0 100 6 3 3 0 000-6z"/>` },
  { name: "Too", inner: `<path d="M6 6h12v12H6V6zm2 2v8h8V8H8z"/>` },
]

export default function TrustedBy() {
  const { locale } = useLanguage();

  // Duplicate so the marquee loops seamlessly
  const marqueeItems = [...companies, ...companies];

  return (
    <section className="border-b border-border bg-background py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-center font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-8">
          {t('home.trusted_by.label', locale)}
        </p>

        <div className="relative overflow-hidden">
          <div
            className="flex w-max items-center gap-x-10 md:gap-x-14"
            style={{ animation: 'bh-trustedby-marquee 26s linear infinite' }}
          >
            {marqueeItems.map((company, idx) => (
              <div
                key={`${company.name}-${idx}`}
                className="group flex items-center gap-2.5 opacity-65 transition-all duration-300 hover:opacity-100"
              >
                <div
                  className="flex h-8 w-8 items-center justify-center text-secondary transition-colors group-hover:text-primary"
                  title={company.name}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill={company.attributes?.fill || 'currentColor'}
                    stroke={company.attributes?.stroke || 'none'}
                    strokeWidth={company.attributes?.strokeWidth || '0'}
                    className="h-5 w-5"
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: company.inner }}
                  />
                </div>
                <span className="text-sm font-semibold text-secondary transition-colors group-hover:text-primary">
                  {company.name}
                </span>
              </div>
            ))}
          </div>

          <style jsx>{`
            @keyframes bh-trustedby-marquee {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-50%);
              }
            }
          `}</style>
        </div>

        <p className="mt-8 text-center text-[10px] font-mono text-muted-foreground/60">
          {t('home.trusted_by.footer', locale)}
        </p>
      </div>
    </section>
  );
}
