import Link from "next/link";
import { ArrowRight, CircleDashed } from "lucide-react";
import { Ballu, type BalluEmotion } from "@/components/mascot/ballu";
import { cn } from "@/lib/utils";

export interface ComingSoonLink {
  label: string;
  href: string;
  /** Internal links use next/link, external ones open in a new tab. */
  external?: boolean;
}

export interface ComingSoonProps {
  /** Small label above the title, e.g. "Programs". */
  eyebrow: string;
  title: string;
  description: string;
  /** What is actually being built. Rendered as a plain list, not fake data. */
  planned: string[];
  /** Honest note about the current state. */
  status?: string;
  mascot?: BalluEmotion;
  primary?: ComingSoonLink;
  secondary?: ComingSoonLink;
  className?: string;
  /** Heading level for the title. Defaults to h1. */
  headingLevel?: "h1" | "h2" | "h3";
}

/**
 * ComingSoon — the honest placeholder for routes that are public but not
 * finished. It deliberately shows no metrics, no names, and no prices: only
 * what the page will hold and where the visitor can go meanwhile.
 */
export function ComingSoon({
  eyebrow,
  title,
  description,
  planned,
  status = "In design and build. Nothing here is live yet.",
  mascot = "tablet",
  primary,
  secondary,
  className,
  headingLevel = "h1",
}: ComingSoonProps) {
  const HeadingTag = headingLevel;
  return (
    <div className={cn("mx-auto max-w-3xl", className)}>
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <Ballu emotion={mascot} size={112} className="shrink-0" />
        <div className="min-w-0">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-primary-red">
            {eyebrow}
          </p>
          <HeadingTag className="text-4xl font-black leading-[1.05] tracking-tight text-primary sm:text-5xl">
            {title}
          </HeadingTag>
          <p className="mt-3 max-w-prose text-base leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-10 rounded-xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <CircleDashed className="h-4 w-4 text-primary-red" aria-hidden="true" />
          <h2 className="text-sm font-bold text-primary">What this page will hold</h2>
        </div>
        <ul className="mt-4 space-y-2.5">
          {planned.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-relaxed text-secondary">
              <span
                aria-hidden="true"
                className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary-red/70"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 border-t border-border pt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          {status}
        </p>
      </div>

      {(primary || secondary) && (
        <div className="mt-8 flex flex-wrap gap-3">
          {primary &&
            (primary.external ? (
              <a
                href={primary.href}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 rounded-full bg-bh-red-action px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-deep-red"
              >
                {primary.label}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            ) : (
              <Link
                href={primary.href}
                className="inline-flex items-center gap-2 rounded-full bg-bh-red-action px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-deep-red"
              >
                {primary.label}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ))}
          {secondary &&
            (secondary.external ? (
              <a
                href={secondary.href}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-surface-hover"
              >
                {secondary.label}
              </a>
            ) : (
              <Link
                href={secondary.href}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-surface-hover"
              >
                {secondary.label}
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
