"use client"

import { Ballu } from "@/components/mascot/ballu"
import { useLanguage } from "@/components/language-provider"
import { t } from "@/lib/i18n"


// metadata disabled because this page is a client component (Next.js forbids exporting metadata from client components).

export default function OfflinePage() {
  const { locale } = useLanguage()

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-red/10">
        <Ballu emotion="error-calm" size={64} />
      </div>
      <h1 className="mt-8 text-3xl font-extrabold text-primary md:text-4xl">
        {t('offline.title', locale)}
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-secondary">
        {t('offline.description', locale)}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-bh-red-action px-8 py-3 text-sm font-bold text-white shadow-[0_0_20px_var(--glow-bh-red)] transition-all hover:bg-deep-red"
      >
        {t('common.retry', locale)}
      </button>
    </main>
  )
}
