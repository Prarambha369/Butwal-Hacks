"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export default function CodeBlock({ code, language = "bash" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-xl bg-[var(--color-bg-base)] border border-glass overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-glass">
        <span className="text-xs font-mono text-secondary">{language}</span>
        <button onClick={handleCopy} className="text-xs text-secondary hover:text-primary transition-colors">
          {copied ? <Check className="w-4 h-4 text-status-green" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm font-mono text-primary leading-relaxed">{code}</code>
      </pre>
    </div>
  );
}
