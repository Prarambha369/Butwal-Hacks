"use client"

import { Check, Copy } from "lucide-react"
import { useMemo, useState } from "react"

type CodeBlockProps = {
  language: string
  code: string
  showLineNumbers?: boolean
}

export default function CodeBlock({ language, code, showLineNumbers = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const lines = useMemo(() => code.trimEnd().split("\n"), [code])

  const onCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{language}</span>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Copy code"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <pre className="overflow-x-auto p-4 text-sm leading-6 text-foreground">
        {lines.map((line, index) => (
          <div key={`${index}-${line}`} className="grid grid-cols-[auto_1fr] gap-4">
            {showLineNumbers ? <span className="text-muted-foreground/70 select-none">{index + 1}</span> : null}
            <code>{line || " "}</code>
          </div>
        ))}
      </pre>
    </div>
  )
}
