"use client";

import { Heart, GraduationCap, Users } from "lucide-react";
import { type ComponentType } from "react";
import { useLanguage } from "@/components/language-provider";
import { t } from "@/lib/i18n";

type ValueCard = {
  id: string;
  labelKey: string;
  descKey: string;
};

const values: ValueCard[] = [
  {
    id: "free",
    labelKey: "home.impact.values.free.label",
    descKey: "home.impact.values.free.desc",
  },
  {
    id: "mentorship",
    labelKey: "home.impact.values.mentorship.label",
    descKey: "home.impact.values.mentorship.desc",
  },
  {
    id: "community",
    labelKey: "home.impact.values.community.label",
    descKey: "home.impact.values.community.desc",
  },
];

const visibleIcons = [Heart, GraduationCap, Users];

function ValueCard({ item, icon: Icon, index, locale }: { item: ValueCard; icon: ComponentType<{ className?: string }>; index: number; locale: "en" | "ne" }) {
  return (
    <div
      className="bh-card p-6 text-center space-y-3 hover:-translate-y-0.5 transition-all duration-300"
      style={{
        transitionDelay: `${index * 100}ms`,
      }}
    >
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary-red/10 text-primary-red">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-lg font-extrabold text-primary">
          {t(item.labelKey, locale)}
        </p>
      </div>
      <p className="text-xs text-text-secondary leading-relaxed">
        {t(item.descKey, locale)}
      </p>
    </div>
  );
}

export default function ImpactMetrics() {
  const { locale } = useLanguage();
  return (
    <section className="py-16 md:py-20 bg-surface border-b border-border">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-red/8 text-[10px] font-mono font-semibold text-primary-red tracking-tight">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary-red" />
            {t("home.impact.badge", locale)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {values.map((item, i) => (
            <ValueCard key={item.id} item={item} icon={visibleIcons[i] ?? Users} index={i} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}