/* eslint-disable react/no-unescaped-entities, react/jsx-key */
"use client";

import React from "react";
import {
  Users,
  Calendar,
  Bell,
  Star,
  Activity,
  Zap,
  Code,
  Copy,
  Check,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";

/* ─── Copy button helper ──────────────────────────────────────────── */

function CodeSnippet({ code }: { code: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group relative">
      <pre className="overflow-x-auto rounded-lg border border-border bg-background p-4 font-mono text-[13px] leading-relaxed text-secondary">
        {code}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md opacity-0 transition-opacity group-hover:opacity-100 hover:bg-surface/50"
        aria-label="Copy code"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-secondary" />
        )}
      </button>
    </div>
  );
}

/* ─── Preview card wrapper ────────────────────────────────────────── */

function PreviewCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <SectionHeading variant="badge" badge={label} color="blue" as="h4">
        Example
      </SectionHeading>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

/* ─── Color swatch grid ───────────────────────────────────────────── */

function ColorRow({
  variant,
  label,
  icon,
  badge,
  animate,
  as,
}: {
  variant: "accent" | "icon" | "badge" | "dot" | "plain";
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  animate?: boolean;
  as?: "h2" | "h3" | "h4";
}) {
  const colors = ["red", "green", "yellow", "blue", "orange"] as const;

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-secondary">
        {label}
      </div>
      <div className="flex flex-wrap gap-4">
        {colors.map((color) => (
          <div key={color} className="shrink-0">
            <SectionHeading
              variant={variant}
              color={color}
              icon={icon}
              badge={badge}
              animate={animate}
              as={as}
            >
              {color}
            </SectionHeading>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */

export default function SectionHeadingDocsPage() {
  return (
    <main    className="min-h-dvh bg-background text-primary">
      {/* Header */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-secondary">
            <Code className="h-3 w-3" />
            UI Components
          </div>
          <h1 className="mt-4 text-3xl font-bold text-primary md:text-4xl">
            SectionHeading
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-secondary leading-relaxed">
            A reusable section header component with five visual variants.
            Use it to add consistent, varied heading treatments across
            dashboards and public pages.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 space-y-12">
        {/* ── Import ─────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-primary">
            Import
          </h2>
          <CodeSnippet code={`import { SectionHeading } from "@/components/ui/section-heading";`} />
        </section>

        {/* ── API Table ──────────────────────────────────────────── */}
        <section>
          <h2 className="mb-4 text-lg font-bold text-primary">Props</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-background">
                <tr>
                  <th className="px-4 py-3 font-semibold text-primary">Prop</th>
                  <th className="px-4 py-3 font-semibold text-primary">Type</th>
                  <th className="px-4 py-3 font-semibold text-primary">Default</th>
                  <th className="px-4 py-3 font-semibold text-primary">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["variant*", <code key="v" className="text-primary-red font-mono text-xs">"accent" | "icon" | "badge" | "dot" | "plain"</code>, "—", "Visual treatment for the heading"],
                  ["children*", <code key="ch" className="text-blue-500 font-mono text-xs">ReactNode</code>, "—", "Heading text"],
                  ["icon", <code key="i" className="text-blue-500 font-mono text-xs">ReactNode</code>, "—", "Lucide icon (required for icon variant)"],
                  ["badge", <code key="b" className="text-secondary font-mono text-xs">string</code>, "—", "Pill label text (required for badge variant)"],
                  ["color", <code key="c" className="text-secondary font-mono text-xs">"red" | "green" | "yellow" | "blue" | "orange"</code>, <span className="text-primary-red font-mono text-xs">"red"</span>, "Accent color"],
                  ["animate", <code key="a" className="text-secondary font-mono text-xs">boolean</code>, <code className="text-xs font-mono">false</code>, "Pulse animation (dot variant only)"],
                  ["as", <code key="as" className="text-secondary font-mono text-xs">"h2" | "h3" | "h4"</code>, <code className="text-xs font-mono">"h3"</code>, "HTML heading level"],
                  ["className", <code key="cn" className="text-secondary font-mono text-xs">string</code>, "—", "Additional CSS classes"],
                ].map(([prop, type, def, desc]) => (
                  <tr key={prop as string} className="odd:bg-surface even:bg-background">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{prop as string}</td>
                    <td className="px-4 py-3">{type}</td>
                    <td className="px-4 py-3 text-xs text-secondary">{def}</td>
                    <td className="px-4 py-3 text-xs text-secondary">{desc as string}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Variant: Accent ────────────────────────────────────── */}
        <section>
          <SectionHeading variant="accent" color="red" as="h2">
            accent
          </SectionHeading>
          <p className="mt-2 mb-5 text-sm text-secondary">
            A thin vertical bar on the left. Best for top-level sections
            on dashboards.
          </p>

          <PreviewCard label="Accent">
            <ColorRow variant="accent" label="Default (h3)" />
            <SectionHeading variant="plain" as="h4">
              as=&quot;h4&quot; — compact
            </SectionHeading>
            <SectionHeading variant="accent" as="h4">
              Compact heading
            </SectionHeading>
          </PreviewCard>

          <div className="mt-3">
            <p className="mb-2 text-xs font-semibold text-secondary">Usage</p>
            <CodeSnippet code={`<SectionHeading variant="accent">Your Chapters</SectionHeading>\n<SectionHeading variant="accent" color="green">Active Projects</SectionHeading>\n<SectionHeading variant="accent" as="h2">Top Level</SectionHeading>`} />
          </div>
        </section>

        {/* ── Variant: Icon ──────────────────────────────────────── */}
        <section>
          <SectionHeading variant="accent" color="yellow" as="h2">
            icon
          </SectionHeading>
          <p className="mt-2 mb-5 text-sm text-secondary">
            A Lucide icon inside a small tinted badge. Great for activity
            feeds, stats panels, and sidebar sections.
          </p>

          <PreviewCard label="Icon">
            <ColorRow variant="icon" icon={<Activity size={14} />} label="Activity icon" />
            <ColorRow variant="icon" icon={<Users size={14} />} label="Users icon" />
            <ColorRow variant="icon" icon={<Calendar size={14} />} label="Calendar icon" />
            <ColorRow variant="icon" icon={<Bell size={14} />} label="Notifications icon" />
            <ColorRow variant="icon" icon={<Star size={14} />} label="Star icon" />
          </PreviewCard>

          <div className="mt-3">
            <p className="mb-2 text-xs font-semibold text-secondary">Usage</p>
            <CodeSnippet code={`<SectionHeading\n  variant="icon"\n  icon={<Activity size={14} />}\n>\n  Activity Feed\n</SectionHeading>\n\n<SectionHeading\n  variant="icon"\n  icon={<Users size={14} />}\n  color="blue"\n>\n  Team Members\n</SectionHeading>`} />
          </div>
        </section>

        {/* ── Variant: Badge ─────────────────────────────────────── */}
        <section>
          <SectionHeading variant="accent" color="green" as="h2">
            badge
          </SectionHeading>
          <p className="mt-2 mb-5 text-sm text-secondary">
            A small colored pill next to the heading. Use for section
            categories, status labels, or context tags.
          </p>

          <PreviewCard label="Badge">
            <ColorRow variant="badge" badge="Milestones" label="Milestones badge" />
            <ColorRow variant="badge" badge="Daily" label="Daily badge" />
            <ColorRow variant="badge" badge="New" label="New badge" />
          </PreviewCard>

          <div className="mt-3">
            <p className="mb-2 text-xs font-semibold text-secondary">Usage</p>
            <CodeSnippet code={`<SectionHeading variant="badge" badge="Milestones">\n  Next Up\n</SectionHeading>\n\n<SectionHeading\n  variant="badge"\n  badge="Daily"\n  color="yellow"\n  as="h4"\n>\n  Mission\n</SectionHeading>`} />
          </div>
        </section>

        {/* ── Variant: Dot ───────────────────────────────────────── */}
        <section>
          <SectionHeading variant="accent" color="blue" as="h2">
            dot
          </SectionHeading>
          <p className="mt-2 mb-5 text-sm text-secondary">
            A small colored circle. Add <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs text-primary-red">animate</code> to make it
            pulse. Ideal for live indicators and real-time sections.
          </p>

          <PreviewCard label="Dot">
            <ColorRow variant="dot" label="Static dots (default)" />
            <ColorRow variant="dot" animate label="Animated (pulse)" />
          </PreviewCard>

          <div className="mt-3">
            <p className="mb-2 text-xs font-semibold text-secondary">Usage</p>
            <CodeSnippet code={`<SectionHeading variant="dot" color="green" animate>\n  Live Community Activity\n</SectionHeading>\n\n<SectionHeading variant="dot" color="red">\n  Active Incidents\n</SectionHeading>`} />
          </div>
        </section>

        {/* ── Variant: Plain ─────────────────────────────────────── */}
        <section>
          <SectionHeading variant="accent" color="orange" as="h2">
            plain
          </SectionHeading>
          <p className="mt-2 mb-5 text-sm text-secondary">
            Just the heading text, no decoration. Use for low-emphasis
            sections or inside cards where space is tight.
          </p>

          <PreviewCard label="Plain">
            <ColorRow variant="plain" label="Plain — color ignored" />
          </PreviewCard>

          <div className="mt-3">
            <p className="mb-2 text-xs font-semibold text-secondary">Usage</p>
            <CodeSnippet code={`<SectionHeading variant="plain">Quick Links</SectionHeading>\n<SectionHeading variant="plain" as="h4">Card Title</SectionHeading>`} />
          </div>
        </section>

        {/* ── Heading Levels ─────────────────────────────────────── */}
        <section>
          <SectionHeading variant="accent" as="h2">
            Heading Levels
          </SectionHeading>
          <p className="mt-2 mb-5 text-sm text-secondary">
            Control the semantic HTML element with the <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs text-primary-red">as</code> prop.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            {(["h2", "h3", "h4"] as const).map((level) => (
              <div key={level} className="rounded-lg border border-border bg-surface p-5">
                <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-secondary">
                  {level}
                </div>
                <SectionHeading variant="accent" as={level}>
                  Accent heading
                </SectionHeading>
                <div className="mt-4">
                  <SectionHeading variant="badge" badge="v1" as={level}>
                    Badge heading
                  </SectionHeading>
                </div>
                <div className="mt-4">
                  <SectionHeading variant="dot" color="green" as={level}>
                    Dot heading
                  </SectionHeading>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Quick Reference ────────────────────────────────────── */}
        <section className="rounded-xl border border-border bg-surface p-6 md:p-8">
          <SectionHeading variant="icon" icon={<Zap className="h-4 w-4" />} color="red">
            Quick Reference
          </SectionHeading>
          <p className="mt-3 text-sm text-secondary leading-relaxed">
            Copy-paste the pattern you need:
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <CodeSnippet code={`<SectionHeading variant="accent">Section</SectionHeading>`} />
            <CodeSnippet code={`<SectionHeading variant="icon" icon={<Activity size={14} />}>Activity</SectionHeading>`} />
            <CodeSnippet code={`<SectionHeading variant="badge" badge="Label">Section</SectionHeading>`} />
            <CodeSnippet code={`<SectionHeading variant="dot" color="green" animate>Live</SectionHeading>`} />
            <CodeSnippet code={`<SectionHeading variant="plain">Plain Title</SectionHeading>`} />
            <CodeSnippet code={`<SectionHeading variant="badge" badge="Daily" color="yellow" as="h4">Mission</SectionHeading>`} />
          </div>
        </section>
      </div>
    </main>
  );
}
