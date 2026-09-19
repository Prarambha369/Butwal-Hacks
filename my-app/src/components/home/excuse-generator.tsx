"use client";

import { useState } from "react";
import { Dices } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { t } from "@/lib/i18n";

/** Number of excuses. Kept in sync with home.excuses.1..N keys + the test. */
export const EXCUSE_COUNT = 10;

/**
 * ExcuseGenerator — one playful block before the final invitation.
 * Press the button, get a silly reason to skip a hackathon, then get
 * told to come anyway. All excuses are jokes; the kicker is honest.
 * Client state only, no backend, no fake data.
 */
export default function ExcuseGenerator() {
  const { locale } = useLanguage();
  const [index, setIndex] = useState(0);
  const [spins, setSpins] = useState(0);

  const roll = () => {
    setIndex((prev) => {
      if (EXCUSE_COUNT <= 1) return 0;
      let next = Math.floor(Math.random() * EXCUSE_COUNT);
      if (next === prev) next = (next + 1) % EXCUSE_COUNT;
      return next;
    });
    setSpins((s) => s + 1);
  };

  return (
    <section className="border-b border-border bg-surface py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary-red/10 bg-primary-red/5 px-3 py-1">
          <span className="font-mono text-[10px] font-semibold text-primary-red">
            {t("home.excuses.badge", locale)}
          </span>
        </div>
        <h2 className="text-2xl font-bold text-primary md:text-3xl">
          {t("home.excuses.title", locale)}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {t("home.excuses.subtitle", locale)}
        </p>

        <div className="bh-card mx-auto mt-8 max-w-xl p-6 md:p-8">
          <p
            key={`${index}-${locale}-${spins}`}
            className="animate-bh-pop-in min-h-12 font-mono text-sm leading-relaxed text-primary md:text-base"
          >
            &ldquo;{t(`home.excuses.${index + 1}`, locale)}&rdquo;
          </p>
          <button
            type="button"
            onClick={roll}
            className="bh-btn-secondary bh-wiggle-hover mx-auto mt-6 text-sm"
          >
            <Dices className="h-4 w-4" aria-hidden="true" />
            <span>{t("home.excuses.button", locale)}</span>
          </button>
        </div>

        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-text-secondary">
          {t("home.excuses.kicker", locale)}
        </p>
      </div>
    </section>
  );
}
