"use client";

import Link from "next/link";
import { ShieldCheck, FolderGit2, Fingerprint, ArrowRight } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { t } from "@/lib/i18n";

const FEATURES = [
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    titleKey: "home.cta.trust_markers",
    descKey: "home.cta.trust_desc",
  },
  {
    icon: <FolderGit2 className="w-6 h-6" />,
    titleKey: "home.cta.projects",
    descKey: "home.cta.projects_desc",
  },
  {
    icon: <Fingerprint className="w-6 h-6" />,
    titleKey: "home.cta.bh_id",
    descKey: "home.cta.bh_id_desc",
  },
];

export default function FeaturesCTA() {
  const { locale } = useLanguage();
  return (
    <section className="py-20 md:py-28">
      <div className="bh-container">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">
            {t('home.cta.title', locale)}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            {t('home.cta.subtitle', locale)}
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {FEATURES.map((feature) => (
            <div
              key={feature.titleKey}
              className="bh-card p-6 md:p-8 space-y-5 hover:shadow-[var(--bh-shadow-md)] hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="w-11 h-11 rounded-xl bg-primary-red/10 flex items-center justify-center text-primary-red group-hover:scale-110 transition-transform duration-200">
                {feature.icon}
              </div>
              <div className="space-y-2.5">
                <h3 className="text-lg font-bold text-primary">
                  {t(feature.titleKey, locale)}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(feature.descKey, locale)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Final CTA */}
        <div className="mt-20 overflow-hidden rounded-2xl border border-primary-red/10 bg-surface">
          <div className="px-8 py-14 md:py-20 text-center space-y-6">
            <h3 className="text-2xl md:text-3xl font-bold text-primary max-w-lg mx-auto leading-tight">
              {t('home.cta.ready', locale)}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              {t('home.cta.ready_desc', locale)}
            </p>
            <div className="pt-2">
              <Link
                href="https://app.butwalhacks.com/auth/login"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary-red text-white text-sm font-bold hover:bg-deep-red transition-all shadow-[var(--bh-glow-red-soft)] hover:shadow-[var(--bh-glow-red)] hover:scale-[1.02] active:scale-[0.98]"
              >
                {t('home.cta.claim', locale)}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}