"use client";

import { Fingerprint, UsersRound, KanbanSquare, Medal, Github, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/components/language-provider"
import { t } from "@/lib/i18n"

const features = [
  {
    titleKey: "home.features.hacker_id.title",
    descKey: "home.features.hacker_id.desc",
    icon: Fingerprint,
    color: "text-primary-red bg-primary-red/8",
    href: "/explore",
    span: "md:col-span-1 md:row-span-1",
  },
  {
    titleKey: "home.features.team_matching.title",
    descKey: "home.features.team_matching.desc",
    icon: UsersRound,
    color: "text-status-blue bg-status-blue/8",
    href: "/explore",
    span: "md:col-span-1 md:row-span-2",
  },
  {
    titleKey: "home.features.task_management.title",
    descKey: "home.features.task_management.desc",
    icon: KanbanSquare,
    color: "text-status-green bg-status-green/8",
    href: "/events",
    span: "md:col-span-1 md:row-span-1",
  },
  {
    titleKey: "home.features.bounties.title",
    descKey: "home.features.bounties.desc",
    icon: Medal,
    color: "text-status-yellow bg-status-yellow/8",
    href: "/support#opportunities",
    span: "md:col-span-1 md:row-span-1",
  },
  {
    titleKey: "home.features.github.title",
    descKey: "home.features.github.desc",
    icon: Github,
    color: "text-primary bg-surface-hover",
    href: "/explore",
    span: "md:col-span-1 md:row-span-1",
  },
]

/**
 * StaggeredFeatures — mixed layout with visual variety
 *
 * Intentionally avoids the "6 identical icon cards in a 3-column grid" pattern.
 * Cards have varied sizes, the last row uses a 2-column split for asymmetry,
 * and a highlighted callout card breaks the rhythm.
 */
export default function StaggeredFeatures() {
  const { locale } = useLanguage();
  return (
    <section className="border-b border-border bg-background py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        {/* Minimal header — no eyebrow, just a plain heading */}
        <div className="mb-14 max-w-xl">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary leading-[1.1]">
            {t('home.features.title', locale)}
          </h2>
          <p className="mt-3 text-sm text-text-secondary leading-relaxed max-w-lg">
            {t('home.features.subtitle', locale)}
          </p>
        </div>

        {/* Mixed layout grid — not all cards are the same */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 auto-rows-[minmax(180px,auto)]">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Link
                key={feature.titleKey}
                href={feature.href}
                className={`group bh-play-hover relative rounded-xl border border-border bg-surface p-6 md:p-7 transition-all duration-200 hover:shadow-sm ${feature.span}`}
              >
                <div className={`bh-play-target inline-flex h-9 w-9 items-center justify-center rounded-lg ${feature.color} mb-4`}>
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <h3 className="text-base font-semibold text-primary mb-1.5 group-hover:text-primary-red transition-colors">
                  {t(feature.titleKey, locale)}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {t(feature.descKey, locale)}
                </p>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-primary-red transition-colors">
                  <span>{t('common.learn_more', locale)}</span>
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            )
          })}


        </div>
      </div>
    </section>
  )
}