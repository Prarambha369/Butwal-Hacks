"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import AuthAwareCta from "@/components/auth-aware-cta"
import { useLanguage } from "@/components/language-provider"
import { t } from "@/lib/i18n"
import { useSiteContent } from "@/components/site-content"

/**
 * TerminalTyper — a tiny terminal that types two honest lines on loop:
 * a command, then the punchline. Blinking caret included.
 * Pure React state, no deps. Typing is content, so it runs even for
 * reduced-motion users (the caret blink is CSS-gated instead).
 */
function TerminalTyper({ locale }: { locale: "en" | "ne" }) {
  const line1 = t("home.hero.terminal.line1", locale);
  const line2 = t("home.hero.terminal.line2", locale);
  const script = `${line1}\n${line2}`;
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
  }, [script]);

  useEffect(() => {
    if (count >= script.length) {
      const hold = setTimeout(() => setCount(0), 4000);
      return () => clearTimeout(hold);
    }
    const timer = setTimeout(() => setCount((c) => c + 1), count === line1.length ? 500 : 42);
    return () => clearTimeout(timer);
  }, [count, script, line1.length]);

  const typed = script.slice(0, count);
  const [first, ...rest] = typed.split("\n");

  return (
    <div
      aria-hidden="true"
      className="mx-auto mb-8 w-fit max-w-full overflow-hidden rounded-xl border border-border bg-surface-inverse shadow-sm"
    >
      {/* Terminal title bar */}
      <div className="flex items-center gap-1.5 border-b border-border/60 px-4 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-primary-red/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-status-yellow/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-status-green/80" />
        <span className="ml-2 font-mono text-[10px] text-text-secondary">butwal-hacks — zsh</span>
      </div>
      <div className="px-4 py-3 text-left font-mono text-xs sm:text-sm">
        <p className="text-text-secondary break-all">
          <span className="text-status-green">$</span> {first}
          {count < script.length && count >= 0 && rest.length === 0 && <span className="bh-caret text-primary-red">▍</span>}
        </p>
        {rest.length > 0 && (
          <p className="text-status-green break-words">
            {rest.join("\n")}
            {count < script.length && <span className="bh-caret text-primary-red">▍</span>}
          </p>
        )}
        {count >= script.length && (
          <p>
            <span className="text-status-green">$</span> <span className="bh-caret text-primary-red">▍</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default function Hero() {
  const { locale } = useLanguage();
  const title = useSiteContent("hero.title", "home.hero.title");
  const subtext = useSiteContent("hero.subtext", "home.hero.subtext");
  return (
    <section className="relative w-full overflow-hidden bg-surface py-20 md:py-32">
      {/* Blueprint grid wash + soft red glow behind the terminal */}
      <div aria-hidden="true" className="bh-bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_80%_at_50%_30%,black,transparent)]" />
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-primary-red/8 blur-3xl" />
      <div className="bh-container relative">
        {/* Floating stickers — desktop only, clearly jokes, honestly free */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
          <span
            className="animate-bh-float absolute left-[2%] top-[8%] rounded-full border border-border bg-background px-3 py-1 font-mono text-xs font-semibold text-primary-red shadow-sm"
            style={{ ["--bh-float-rot" as string]: "-6deg", animationDelay: "0s" }}
          >
            {t("home.hero.sticker1", locale)}
          </span>
          <span
            className="animate-bh-float absolute right-[3%] top-[22%] rounded-full border border-border bg-background px-3 py-1 font-mono text-xs font-semibold text-status-blue shadow-sm"
            style={{ ["--bh-float-rot" as string]: "5deg", animationDelay: "1.2s" }}
          >
            {t("home.hero.sticker2", locale)}
          </span>
          <span
            className="animate-bh-float absolute bottom-[10%] left-[8%] rounded-full border border-border bg-background px-3 py-1 font-mono text-xs font-semibold text-status-green shadow-sm"
            style={{ ["--bh-float-rot" as string]: "3deg", animationDelay: "2.4s" }}
          >
            {t("home.hero.sticker3", locale)}
          </span>
        </div>

        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <TerminalTyper locale={locale} />

          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-primary leading-[1.08]">
            {title}
          </h1>

          {/* Subheading */}
          <p className="mt-6 max-w-2xl text-base sm:text-lg md:text-xl leading-relaxed text-text-secondary">
            {subtext}
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
            <AuthAwareCta
              actionHref="/dashboard/hacker"
              actionLabel={t('action.go_to_dashboard', locale)}
              variant="primary"
              className="bh-btn-primary bh-wiggle-hover"
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
