"use client";

import { useLanguage } from "@/components/language-provider";
import { t } from "@/lib/i18n";

const STEPS = [
  {
    n: "01",
    titleKey: "home.steps.step1.title",
    descKey: "home.steps.step1.desc",
  },
  {
    n: "02",
    titleKey: "home.steps.step2.title",
    descKey: "home.steps.step2.desc",
  },
  {
    n: "03",
    titleKey: "home.steps.step3.title",
    descKey: "home.steps.step3.desc",
  },
];

/**
 * StepsStrip — orientation, not an ask. No buttons here on purpose.
 * Extracted from the old FeaturesCTA so the homepage keeps the calm
 * three-step strip without the duplicate feature-card grid.
 */
export default function StepsStrip() {
  const { locale } = useLanguage();
  return (
    <section className="border-b border-border bg-background py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-3">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-primary-red">
            {t("home.steps.badge", locale)}
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-primary leading-[1.05] tracking-tight text-balance">
            {t("home.steps.title", locale)}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("home.steps.subtitle", locale)}
          </p>
          <div aria-hidden="true" className="mx-auto h-1 w-16 rounded-full bg-primary-red" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {STEPS.map((step) => (
            <div key={step.n} className="bh-card bh-play-hover bh-dashed-hover p-6 md:p-8 space-y-3">
              <p className="bh-play-target inline-block font-mono text-xs font-bold text-muted-foreground/60">
                {step.n}
              </p>
              <h3 className="text-lg font-bold text-primary">
                {t(step.titleKey, locale)}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(step.descKey, locale)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
