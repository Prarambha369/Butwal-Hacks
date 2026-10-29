import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

import Breadcrumbs from "@/components/breadcrumbs";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Guides | Butwal Hacks",
  description: "Guides and resources for students joining hackathons and building in Nepal's tech community.",
  path: "/guides",
});

const guides = [
  {
    title: "How to Join a Hackathon in Nepal",
    description: "Step-by-step guide to finding, registering, and joining your first free hackathon in Nepal.",
    href: "/guides/how-to-join-a-hackathon-in-nepal",
  },
];

export default function GuidesPage() {
  return (
    <main className="min-h-dvh bg-background">
      <section className="mx-auto max-w-4xl px-4 py-14 sm:py-16">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Guides" }]} />
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-lg bg-primary-red/10 shrink-0">
            <BookOpen className="w-6 h-6 text-primary-red" />
          </div>
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold font-heading tracking-tight text-primary">
              Guides
            </h1>
            <p className="mt-2 text-muted-foreground">
              Resources to help you get started with hackathons and tech in Nepal.
            </p>
            <p className="mt-1 text-xs font-mono text-muted-foreground">
              Last updated: 2026-10-29
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          {guides.map((guide) => (
            <Link
              key={guide.href}
              href={guide.href}
              className="group rounded-xl border border-border bg-surface p-6 transition-colors hover:border-primary-red/40"
            >
              <h2 className="text-xl font-bold text-primary mb-2 group-hover:text-primary-red transition-colors">
                {guide.title}
              </h2>
              <p className="text-muted-foreground mb-4">{guide.description}</p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-red">
                Read guide
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
