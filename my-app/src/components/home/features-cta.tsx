"use client";

import { useLanguage } from "@/components/language-provider";
import { t } from "@/lib/i18n";

function TrustMarkerIcon() {
  // Simple, custom, non-LC-icon SVG (looks handcrafted vs icon-library auto-slop)
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6"
      aria-hidden="true"
    >
      <path d="M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4Z" />
      <path d="M9 12l2 2 4-5" />
    </svg>
  );
}

function ProjectLayersIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6"
      aria-hidden="true"
    >
      <path d="M12 2 3 7l9 5 9-5-9-5Z" />
      <path d="M3 12l9 5 9-5" />
      <path d="M3 17l9 5 9-5" />
    </svg>
  );
}

function BhIdFingerprintIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6"
      aria-hidden="true"
    >
      <path d="M8 4h8" />
      <path d="M6.5 9a6.5 6.5 0 0 1 13 0c0 1.8-.6 3-1.5 4.2-.9 1.2-1.5 2.4-1.5 3.8" />
      <path d="M9 15c.8-1 1.9-1.5 3-1.5S14.2 14 15 15" />
      <path d="M12 20h.01" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: <TrustMarkerIcon />,
    color: "bg-primary-red/10 text-primary-red",
    titleKey: "home.cta.trust_markers",
    descKey: "home.cta.trust_desc",
  },
  {
    icon: <ProjectLayersIcon />,
    color: "bg-status-blue/10 text-status-blue",
    titleKey: "home.cta.projects",
    descKey: "home.cta.projects_desc",
  },
  {
    icon: <BhIdFingerprintIcon />,
    color: "bg-status-green/10 text-status-green",
    titleKey: "home.cta.bh_id",
    descKey: "home.cta.bh_id_desc",
  },
];

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

export default function FeaturesCTA() {
  const { locale } = useLanguage();
  return (
    <section className="py-20 md:py-28">
      <div className="bh-container">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">
            {t("home.cta.title", locale)}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            {t("home.cta.subtitle", locale)}
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {FEATURES.map((feature) => (
            <div
              key={feature.titleKey}
              className="bh-card p-6 md:p-8 space-y-5 hover:shadow-[var(--bh-shadow-md)] hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div
                className={`w-11 h-11 rounded-xl ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
              >
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

        {/* How it goes — orientation, not an ask. No buttons here on purpose. */}
        <div className="mt-20">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-primary-red">
              {t("home.steps.badge", locale)}
            </p>
            <h3 className="text-2xl md:text-3xl font-bold text-primary leading-tight">
              {t("home.steps.title", locale)}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("home.steps.subtitle", locale)}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {STEPS.map((step) => (
              <div key={step.n} className="bh-card p-6 md:p-8 space-y-3">
                <p className="font-mono text-xs font-bold text-muted-foreground/60">
                  {step.n}
                </p>
                <h4 className="text-lg font-bold text-primary">
                  {t(step.titleKey, locale)}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(step.descKey, locale)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
