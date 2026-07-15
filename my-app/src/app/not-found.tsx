"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";
import { t } from "@/lib/i18n";

export default function NotFound() {
  const { locale } = useLanguage();

  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-8xl font-extrabold tracking-tight text-primary">404</h1>
        <h2 className="text-2xl font-semibold text-primary">{t('not_found.title', locale)}</h2>
        <p className="text-secondary">
          {t('not_found.description', locale)}
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link href="/">
            <Button>{t('not_found.back_home', locale)}</Button>
          </Link>
          <Link href="/community">
            <Button variant="secondary">{t('not_found.explore_community', locale)}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
