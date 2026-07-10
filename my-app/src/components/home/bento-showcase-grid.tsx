"use client"

import Image from "next/image"
import Link from "next/link"
import { Code2, ExternalLink } from "lucide-react"
import { cloudinaryUrl } from "@/lib/utils"
import type { Project } from "@/lib/supabase-types"
import { FadeIn } from "@/components/home/shared-primitives"

interface BentoShowcaseGridProps {
  projects: Project[]
}

/**
 * BentoShowcaseGrid — irregular Apple-style showcase grid of featured projects.
 *
 * Desktop layout:
 *   ┌──────────────────┬──────────┐
 *   │                  │  Card 2  │
 *   │   Hero Project   ├──────────┤
 *   │   (2×2)          │  Card 3  │
 *   └──────────────────┴──────────┘
 *
 * Mobile: single-column stacked layout.
 * Uses Liquid Glass concentric math: outer 20px → p-1 (4px) → inner 16px.
 */
export default function BentoShowcaseGrid({ projects }: BentoShowcaseGridProps) {
  if (!projects || projects.length < 2) return null

  const [hero, ...rest] = projects
  // Show up to 3 projects (hero + 2 side cards)
  const sideCards = rest.slice(0, 2)

  return (
    <section
      className="border-b border-glass bg-background/30 px-6 py-28"
      aria-label="Showcase projects"
    >
      <FadeIn className="mx-auto w-full max-w-5xl">
        <div className="mb-14 text-center space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-bh-red-500">
            Showcase
          </p>
          <h2 className="text-4xl font-extrabold leading-tight text-primary md:text-5xl">
            Featured Builds
          </h2>
        </div>

        {/* ── Bento Grid ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2">
          {/* ═══ Hero Project — 2 cols × 2 rows ═══ */}
          <div className="group relative overflow-hidden rounded-[20px] border border-white/10 bg-[#2C2C2E]/70 backdrop-blur-[30px] md:col-span-2 md:row-span-2">
            {/* Outer wrapper: p-1 sets the 4px gap for concentric math */}
            <div className="p-1">
              {/* Inner image: 20px - 4px = 16px radius */}
              <div className="relative h-64 overflow-hidden md:h-full rounded-[16px]">
                {hero.cover_image ? (
                  <Image
                    src={cloudinaryUrl(hero.cover_image, 800)}
                    alt={hero.title || "Featured project"}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#2C2C2E]">
                    <Code2 className="h-12 w-12 text-white/20" aria-hidden="true" />
                  </div>
                )}
              </div>
            </div>

            {/* Overlay — slides up from bottom on hover */}
            <div className="absolute bottom-0 left-0 right-0 bg-[var(--color-bg-base)]/80 p-4 backdrop-blur-sm md:p-6">
              <h3 className="text-lg font-bold text-[#F5F5F7]">{hero.title}</h3>
              {hero.description && (
                <p className="mt-1 line-clamp-2 text-sm text-[#8E8E93]">
                  {hero.description}
                </p>
              )}
              {/* Tech stack tags */}
              {Array.isArray(hero.tech_stack) && hero.tech_stack.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {hero.tech_stack.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full border border-white/10 px-2 py-1 font-mono text-xs text-[#8E8E93]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
              <Link
                href={`/projects/${hero.id}`}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-bh-red-500 transition-colors hover:text-white"
              >
                View Project <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* ═══ Side Cards — 1×1 each ═══ */}
          {sideCards.map((project) => (
            <div
              key={project.id}
              className="group relative overflow-hidden rounded-[20px] border border-white/10 bg-[#2C2C2E]/70 backdrop-blur-[30px]"
            >
              <div className="p-1">
                <div className="relative h-40 overflow-hidden rounded-[16px]">
                  {project.cover_image ? (
                    <Image
                      src={cloudinaryUrl(project.cover_image, 600)}
                      alt={project.title || "Project"}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#2C2C2E]">
                      <Code2 className="h-8 w-8 text-white/20" aria-hidden="true" />
                    </div>
                  )}
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-[var(--color-bg-base)]/80 p-3 backdrop-blur-sm">
                <h3 className="text-sm font-bold text-[#F5F5F7]">{project.title}</h3>
                {Array.isArray(project.tech_stack) && project.tech_stack.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {project.tech_stack.slice(0, 2).map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-[#8E8E93]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href={`/projects/${project.id}`}
                className="absolute inset-0 z-10"
                aria-label={`View ${project.title}`}
              />
            </div>
          ))}
        </div>
      </FadeIn>
    </section>
  )
}
