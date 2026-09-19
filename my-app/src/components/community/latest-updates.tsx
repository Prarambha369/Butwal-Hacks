import Link from "next/link"
import { ChevronRight, Calendar, ArrowUpRight } from "lucide-react"
import { blogPosts } from "@/lib/content"
import { formatDualDate } from "@/lib/nepali-date"
import { FadeIn } from "@/components/home/shared-primitives"

export function LatestUpdates() {
  const posts = blogPosts.slice(0, 3)

  return (
    <section className="py-20 md:py-28" aria-label="Latest Community Updates">
      <FadeIn className="mx-auto max-w-6xl px-4">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-red/10 text-[10px] font-bold text-primary-red mb-3">
              Updates
            </span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-primary">
              Latest from the Community
            </h2>
          </div>
          <Link
            href="/blog"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-secondary hover:text-primary transition-colors"
          >
            All posts <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Bento grid — hero post spans 2 cols, two smaller stack in right col */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 auto-rows-[minmax(180px,auto)]">
          {posts.map((post, i) => {
            const isHero = i === 0
            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className={`bh-card p-6 hover:shadow-md transition-all group flex flex-col ${
                  isHero ? "md:col-span-2 md:row-span-2 bg-gradient-to-br from-primary-red/[0.02] to-transparent" : ""
                }`}
              >
                <div className="flex items-center gap-2 text-[11px] font-medium text-secondary/60 mb-3">
                  <Calendar className="w-3.5 h-3.5" />
                  <time dateTime={post.publishedAt}>
                    {formatDualDate(new Date(post.publishedAt))}
                  </time>
                </div>
                <h3 className={`font-bold text-primary group-hover:text-primary-red transition-colors ${
                  isHero ? "text-xl md:text-2xl" : "text-base"
                }`}>
                  {post.title}
                </h3>
                <p className={`mt-2 text-secondary/80 leading-relaxed flex-1 ${
                  isHero ? "text-base" : "text-sm"
                }`}>
                  {post.excerpt}
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-secondary/60 group-hover:text-primary-red transition-colors">
                  Read more <ArrowUpRight className="w-3 h-3" />
                </div>
              </Link>
            )
          })}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm font-medium text-secondary hover:text-primary transition-colors"
          >
            All posts <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </FadeIn>
    </section>
  )
}
