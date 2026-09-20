"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * SectionLabel — uniform code-comment header used across marketing sections.
 *
 * Renders a JetBrains Mono `// name` line (red slashes + muted uppercase name)
 * so every block on the page reads like a comment in a single source file.
 */
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground",
        className
      )}
    >
      <span className="select-none font-bold text-primary-red">{"//"}</span>
      <span>{children}</span>
    </span>
  );
}