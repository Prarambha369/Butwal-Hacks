"use client"

import Link from "next/link"
import AuthAwareCta from "@/components/auth-aware-cta"
import { useLanguage } from "@/components/language-provider"
import { t } from "@/lib/i18n"

export default function Hero() {
  const { locale } = useLanguage();
  return (
    <section className="relative w-full overflow-hidden bg-surface py-20 md:py-32">
      {/* Static decorative blobs — no mouse tracking, no JS overhead */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary-red/5 blur-[120px] pointer-events-none max-md:w-[300px] max-md:h-[300px] max-md:-top-20 max-md:-right-20" />
      <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-status-blue/8 blur-[100px] pointer-events-none max-md:w-[250px] max-md:h-[250px] max-md:-bottom-20 max-md:-left-20" />

      <div className="bh-container relative">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-primary leading-[1.08]">
            Lumbini&apos;s{" "}
            <span className="text-primary-red relative">
              Youth Tech Hub
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary-red/20" viewBox="0 0 200 12" fill="currentColor" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 8 Q50 0 100 8 T200 8" strokeWidth="2" stroke="currentColor" fill="none" />
              </svg>
            </span>
            {""}— For Students, by Students.
          </h1>

          {/* Subheading */}
          <p className="mt-6 max-w-2xl text-base sm:text-lg md:text-xl leading-relaxed text-text-secondary">
            Free hackathons, mentorship, and project-based learning for students in Lumbini Province.
            Build real projects, earn verifiable credentials, and ship code that matters.
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
