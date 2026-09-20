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
 * Cards have varied sizes, index numerals, and an accent rule that fills on
 * hover. A blog strip at the bottom cross-links build stories.
 */
export default function StaggeredFeatures() {
  const { locale } = useLanguage();
  return (
    <section className="border-b border-border bg-background py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        {/* Minimal header — no eyebrow, just a plain heading */}
        <div className="mb-14 max-w-xl">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-primary leading-[1.05] text-balance">
            {t('home.features.title', locale)}
          </h2>
          <p className="mt-3 text-sm text-text-secondary leading-relaxed max-w-lg">
            {t('home.features.subtitle', locale)}
          </p>
        </div>

        {/* Mixed layout grid — not all cards are the same */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 auto-rows-[minmax(180px,auto)]">
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <Link
                key={feature.titleKey}
                href={feature.href}
                className={`group bh-play-hover relative overflow-hidden rounded-xl border border-border bg-surface p-6 md:p-7 transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-primary-red/30 ${feature.span}`}
              >
                <span aria-hidden="true" className="pointer-events-none absolute right-4 top-3 font-mono text-4xl font-black text-border transition-colors group-hover:text-primary-red/20">
                  {String(i + 1).padStart(2, "0")}
                </span>
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
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-primary-red transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            )
          })}


        </div>

        {/* Blog cross-link — tool talk continues in build stories */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 font-mono text-xs font-semibold text-muted-foreground transition-colors hover:text-primary-red"
          >
            <span className="text-primary-red" aria-hidden="true">{"// "}</span>
            {t('home.features.blog_link', locale)}
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  )
}