"use client"

import Link from "next/link"
import AuthAwareCta from "@/components/auth-aware-cta"
import { useLanguage } from "@/components/language-provider"
import { t } from "@/lib/i18n"

export default function Hero() {
  const { locale } = useLanguage();
  return (
    <section className="relative w-full overflow-hidden bg-surface py-20 md:py-32">
      <div className="bh-container relative">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-primary leading-[1.08]">
            {t('home.hero.title', locale)}
          </h1>

          {/* Subheading */}
          <p className="mt-6 max-w-2xl text-base sm:text-lg md:text-xl leading-relaxed text-text-secondary">
            {t('home.hero.subtext', locale)}
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
            <AuthAwareCta 
              actionHref="/dashboard/hacker" 
              actionLabel={t('action.go_to_dashboard', locale)}
              variant="primary" 
              className="bh-btn-primary" 
            />
            <Link
              href="/explore"
              className="bh-btn-secondary inline-flex items-center gap-2 px-8 py-3.5 text-base"
            >
              <span>{t('action.explore_projects', locale)}</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}