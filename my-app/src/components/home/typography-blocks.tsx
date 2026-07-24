"use client"

import { useState } from "react"
import { Quote, Code, CheckCircle, Copy, Check } from "lucide-react"

const blocks = [
  {
    type: "paragraph",
    content:
      "Butwal Hacks is a student-run nonprofit that gives every young technologist in Nepal a verified identity, a portfolio they own, and a community that shows up.",
  },
  {
    type: "blockquote",
    content:
      "Students across Nepal have been building software, hardware, and art without a way to prove it. Butwal Hacks gives them that proof — a record that stays with them.",
    source: "— Community Mission Statement",
  },
  {
    type: "paragraph",
    content:
      "Every member gets a public Hacker ID with verifiable certificates, a GitHub-synced project portfolio, and a shareable profile URL. It stays with you, no matter what events you attend.",
  },
  {
    type: "highlight",
    items: [
      "Verified certificates with cryptographic timestamps",
      "Portfolio that auto-syncs from your GitHub commits",
      "Skill-based team matching for hackathon squads",
      "Bounty payouts tracked publicly via Open Collective",
      "Task boards for hackathon project management",
    ],
  },
  {
    type: "paragraph",
    content:
      "Build your hacker profile in minutes. Complete with trust markers, project portfolio, and a shareable URL.",
  },
  {
    type: "code",
    language: "bash",
    code: "# Get your hacker ID in seconds\ncurl -X POST https://api.butwalhacks.com/profiles \\\n  -H \"Authorization: Bearer $BH_TOKEN\" \\\n  -d '{\"name\": \"Your Name\", \"email\": \"you@example.com\"}'",
  },
]

function CopyButton({ code }: { code: string | undefined }) {
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
      aria-label={copied ? "Copied" : "Copy code"}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-status-green" />
          <span className="text-status-green">Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          <span>Copy</span>
        </>
      )}
    </button>
  )
}

export default function TypographyBlocks() {
  return (
    <section className="border-b border-border bg-surface py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4">
        {/* Section header — clean heading, no eyebrow */}
        <div className="mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary leading-[1.1]">
            Your identity should be yours
          </h2>
          <p className="mt-3 text-sm text-text-secondary leading-relaxed max-w-xl">
            A profile that travels with you — not locked inside a single platform.
          </p>
        </div>

        {/* Typography blocks — Notion document style */}
        <div className="space-y-7">
          {blocks.map((block, i) => {
            switch (block.type) {
              case "paragraph":
                return (
                  <p key={i} className="text-base md:text-lg text-text-body leading-[1.75] max-w-2xl">
                    {block.content}
                  </p>
                )

              case "blockquote":
                return (
                  <div key={i} className="relative pl-6 border-l-2 border-primary-red/40 py-2">
                    <Quote className="absolute -left-2.5 -top-1 h-5 w-5 text-primary-red/20" />
                    <p className="text-base md:text-lg text-text-body italic leading-[1.75]">
                      {block.content}
                    </p>
                    {block.source && (
                      <p className="mt-2 text-sm text-muted-foreground font-mono">{block.source}</p>
                    )}
                  </div>
                )

              case "highlight":
                return (
                  <div key={i} className="space-y-2 py-2">
                    {block.items?.map((item, j) => (
                      <div key={j} className="flex items-start gap-3 group">
                        <CheckCircle className="h-4 w-4 text-status-green mt-0.5 shrink-0 group-hover:text-primary-red transition-colors" />
                        <span className="text-base md:text-lg text-text-body leading-[1.75]">
                          {item}
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
                      <CopyButton code={block.code} />
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
            Read more about our mission →
          </a>
        </div>
      </div>
    </section>
  )
}
