"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { t } from "@/lib/i18n";
import type { Partner } from "@/lib/actions/partners";

export default function TrustedByClient({ partners }: { partners: Partner[] }) {
  const { locale } = useLanguage();
  const marqueeItems = [...partners, ...partners];

  return (
    <section className="border-b border-border bg-background py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-center font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-8">
          {t("home.trusted_by.label", locale)}
          {" · "}
          <Link href="/partners" className="underline underline-offset-4 hover:text-primary transition-colors">
            {t("home.trusted_by.view_all", locale)}
          </Link>
        </p>

        <div className="relative overflow-hidden">
          <div
            className="flex w-max items-center gap-x-10 md:gap-x-14"
            style={{ animation: "bh-trustedby-marquee 26s linear infinite" }}
          >
            {marqueeItems.map((partner, idx) => {
              const inner = (
                <>
                  {partner.logo_url ? (
                    <span className="flex h-8 w-8 items-center justify-center">
                      {/* Plain img: partner logos live on arbitrary hosts outside next/image allowlist */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={partner.logo_url}
                        alt=""
                        width={32}
                        height={32}
                        className="max-h-8 w-auto object-contain"
                        loading="lazy"
                      />
                    </span>
                  ) : null}
                  <span className="text-sm font-semibold text-secondary transition-colors group-hover:text-primary">
                    {partner.name}
                  </span>
                </>
              );
              const cls =
                "group flex items-center gap-2.5 opacity-65 transition-all duration-300 hover:opacity-100";
              return partner.href ? (
                <Link
                  key={`${partner.id}-${idx}`}
                  href={partner.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cls}
                >
                  {inner}
                </Link>
              ) : (
                <div key={`${partner.id}-${idx}`} className={cls}>
                  {inner}
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] font-mono text-muted-foreground/60">
          {t("home.trusted_by.footer", locale)}
        </p>
      </div>
    </section>
  );
}
