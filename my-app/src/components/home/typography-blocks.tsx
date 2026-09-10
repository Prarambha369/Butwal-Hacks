"use client"

import { useState } from "react"
import { Quote, Code, CheckCircle, Copy, Check } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { t } from "@/lib/i18n"

const blocks = [
  {
    type: "paragraph",
    contentKey: "home.typography.p1",
  },
  {
    type: "blockquote",
    contentKey: "home.typography.p2",
    sourceKey: "home.typography.p2_source",
  },
  {
    type: "paragraph",
    contentKey: "home.typography.p3",
  },
  {
    type: "highlight",
    itemKeys: [
      "home.typography.hl1",
      "home.typography.hl2",
      "home.typography.hl3",
      "home.typography.hl4",
      "home.typography.hl5",
    ],
  },
  {
    type: "paragraph",
    contentKey: "home.typography.p4",
  },
  {
    type: "code",
    language: "bash",
    code: "# Get your hacker ID in seconds\ncurl -X POST https://api.butwalhacks.com/profiles \\\n  -H \"Authorization: Bearer $BH_TOKEN\" \\\n  -d '{\"name\": \"Your Name\", \"email\": \"you@example.com\"}'",
  },
]

function CopyButton({ code, locale }: { code: string | undefined; locale: "en" | "ne" }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API not available — fail silently
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="ml-auto flex items-center justify-center gap-1.5 min-w-[44px] min-h-[44px] px-2 py-1 rounded text-xs text-muted-foreground hover:text-white transition-colors focus:ring-2 focus:ring-primary-red focus:outline-none"
      aria-label={copied ? t("common.copied", locale) : t("common.copy", locale)}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-status-green" />
          <span className="text-status-green">{t("common.copied", locale)}</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          <span>{t("common.copy", locale)}</span>
        </>
      )}
    </button>
  )
}

export default function TypographyBlocks() {
  const { locale } = useLanguage();
  return (
    <section className="border-b border-border bg-surface py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4">
        {/* Section header — clean heading, no eyebrow */}
        <div className="mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary leading-[1.1]">
            {t('home.typography.title', locale)}
          </h2>
          <p className="mt-3 text-sm text-text-secondary leading-relaxed max-w-xl">
            {t('home.typography.subtitle', locale)}
          </p>
        </div>

        {/* Typography blocks — Notion document style */}
        <div className="space-y-7">
          {blocks.map((block, i) => {
            switch (block.type) {
              case "paragraph":
                return (
                  <p key={i} className="text-base md:text-lg text-text-body leading-[1.75] max-w-2xl">
                    {t(block.contentKey as string, locale)}
                  </p>
                )

              case "blockquote":
                return (
                  <div key={i} className="relative pl-6 border-l-2 border-primary-red/40 py-2">
                    <Quote className="absolute -left-2.5 -top-1 h-5 w-5 text-primary-red/20" />
                    <p className="text-base md:text-lg text-text-body italic leading-[1.75]">
                      {t(block.contentKey as string, locale)}
                    </p>
                    {block.sourceKey && (
                      <p className="mt-2 text-sm text-muted-foreground font-mono">{t(block.sourceKey as string, locale)}</p>
                    )}
                  </div>
                )

              case "highlight":
                return (
                  <div key={i} className="space-y-2 py-2">
                    {block.itemKeys?.map((itemKey, j) => (
                      <div key={j} className="flex items-start gap-3 group">
                        <CheckCircle className="h-4 w-4 text-status-green mt-0.5 shrink-0 group-hover:text-primary-red transition-colors" />
                        <span className="text-base md:text-lg text-text-body leading-[1.75]">
                          {t(itemKey, locale)}
                        </span>
                      </div>
                    ))}
                  </div>
                )

              case "code":
                return (
                  <div key={i} className="group relative">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-t-lg bg-surface-inverse border-b border-white/5">
                      <Code className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-mono text-muted-foreground">{block.language}</span>
                      <CopyButton code={block.code} locale={locale} />
                    </div>
                    <pre className="rounded-b-lg bg-surface-inverse p-4 overflow-x-auto">
                      <code className="text-sm font-mono text-text-body/80 leading-relaxed whitespace-pre">
                        {block.code}
                      </code>
                    </pre>
                  </div>
                )

              default:
                return null
            }
          })}
        </div>

        {/* Bottom anchor */}
        <div className="mt-12 pt-8 border-t border-border flex items-center justify-end">
          <a
            href="/about"
            className="text-xs font-medium text-primary-red hover:text-deep-red transition-colors"
          >
            {t('home.typography.read_more', locale)}
          </a>
        </div>
      </div>
    </section>
  )
}