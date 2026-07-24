"use client";

import { useState, useMemo, memo } from "react"
import Link from "next/link"
import Image from "next/image"
import { CalendarDays, Clock3, Search, X, ArrowRight, Mail } from "lucide-react"
import { blogPosts, type BlogPost } from "@/lib/content"
import { validateSearchInput, sanitizeString } from "@/lib/validation"
import { Skeleton } from "@/components/ui/skeleton"
import { RoseSpinner } from "@/components/ui/rose-loader"
import { NoResultsState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const categories = ["All Posts", "Development", "Community", "Events"]
const tags = ["#react", "#opensource", "#hackathon", "#backend", "#nepaltech"]

// Animated blog post card with entrance animation
const BlogPostCard = memo(function BlogPostCard({
  post,
  showSponsored,
}: {
  post: BlogPost
  showSponsored: boolean
  index?: number
}) {
  return (
    <div>
      <article className="group border-b border-border pb-8 transition-colors">
        {/* Featured image */}
        {post.cover_image && (
          <div className="relative mb-5 aspect-video w-full overflow-hidden rounded-xl border border-border/30">
            <Image
              src={post.cover_image}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 700px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            {post.publishedAt}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-4 w-4" />
            5 min read
          </span>
        </div>

        {/* Title with hover effect */}
        <h2 className="mt-4 text-2xl sm:text-3xl font-bold leading-tight text-primary group-hover:text-primary-red transition-colors duration-300">
          <Link href={`/blog/${post.slug}`} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-red/40 focus-visible:ring-offset-2 rounded-sm">
            {post.title}
          </Link>
        </h2>

        {/* Excerpt */}
        <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
          {post.excerpt}
        </p>

        {/* Read more link */}
        <Link
          href={`/blog/${post.slug}`}
          className="mt-5 inline-flex items-center gap-2 text-base font-semibold text-primary hover:text-primary-red transition-colors duration-300 group/link"
        >
          Read More
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-1" />
        </Link>
      </article>

      {/* Sponsored card */}
      {showSponsored && (
        <aside className="my-8 bh-card p-6">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sponsored</p>
          <h3 className="mt-2 text-xl sm:text-2xl font-bold text-primary">
            Support Community Infrastructure
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Sponsored placements are clearly labeled and separated from editorial content. This
            supports nonprofit operations without dark patterns.
          </p>
        </aside>
      )}
    </div>
  )
})

export function BlogContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Posts")
  const [isLoading, setIsLoading] = useState(false)
  // ponytail: Entrance animation removed. Content renders immediately.

  // Debounced search with validation
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    const validation = validateSearchInput(rawValue)
    if (!validation.valid && rawValue.length > 0) {
      toast.error(validation.error, { duration: 2000 })
      return
    }
    const sanitized = sanitizeString(rawValue, 100)
    setSearchQuery(sanitized)
    setIsLoading(true)
    setTimeout(() => { setIsLoading(false) }, 300)
  }

  const clearSearch = () => {
    setSearchQuery("")
    toast.success("Search cleared")
  }

  // Filter posts based on search and category
  const filteredPosts = useMemo(() => {
    let posts = blogPosts
    if (selectedCategory !== "All Posts") {
      posts = posts.filter((post) => {
        if (selectedCategory === "Development") return post.slug.includes("tech")
        if (selectedCategory === "Community") return post.slug.includes("mentorship")
        return true
      })
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      posts = posts.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.excerpt.toLowerCase().includes(query) ||
          post.body.some((p) => p.toLowerCase().includes(query))
      )
    }
    return posts
  }, [searchQuery, selectedCategory])

  const hasResults = filteredPosts.length > 0
  const animationKey = `${searchQuery}-${selectedCategory}`

  return (
    <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[240px_1fr_280px]">
      {/* Left Sidebar */}
      <aside className="bh-card p-6 xl:sticky xl:top-24 xl:h-fit">
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Categories</h2>
          <ul className="mt-4 space-y-1">
            {categories.map((category) => (
              <li key={category}>
                <button
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-all",
                    selectedCategory === category
                      ? "bg-primary-red/10 text-primary-red border border-primary-red/20"
                      : "text-muted-foreground hover:text-primary hover:bg-surface-hover"
                  )}
                >
                  {category}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-5 mt-5 border-t border-border">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Trending Tags</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSearchQuery(tag.replace("#", ""))}
                className="rounded-full border border-border bg-surface-hover px-3 py-1 text-[11px] font-medium text-muted-foreground hover:text-primary hover:border-primary-red/20 transition-all"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="min-w-0">
        {/* Header */}
        <div>
          <h1 className="text-5xl font-black tracking-tight text-primary sm:text-6xl">Blog</h1>
          <p className="mt-5 max-w-3xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
            Project breakdowns, community stories, and updates from Butwal Hacks.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mt-10 relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title, topic, or keyword..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="bh-input pl-11 pr-11"
            aria-label="Search blog posts"
            maxLength={100}
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-surface-hover transition-all"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results bar */}
        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <RoseSpinner size="sm" />
              </span>
            ) : (
              <span>
                <span className="font-semibold text-primary">{filteredPosts.length}</span>
                {" "}
                {filteredPosts.length === 1 ? "article" : "articles"}
              </span>
            )}
          </span>
          {(searchQuery || selectedCategory !== "All Posts") && (
            <button
              onClick={() => {
                setSearchQuery("")
                setSelectedCategory("All Posts")
              }}
              className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Posts List */}
        <div className="mt-8 space-y-8" key={animationKey}>
          {isLoading ? (
            <div className="space-y-8">
              <div className="border-b border-border pb-8 space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-10 w-3/4" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-5/6" />
                  <Skeleton className="h-5 w-4/6" />
                </div>
                <Skeleton className="h-6 w-28" />
              </div>
              <div className="border-b border-border pb-8 space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-10 w-3/4" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-5/6" />
                  <Skeleton className="h-5 w-4/6" />
                </div>
                <Skeleton className="h-6 w-28" />
              </div>
            </div>
          ) : !hasResults ? (
            <NoResultsState
              searchQuery={searchQuery || selectedCategory}
              onClear={() => {
                setSearchQuery("")
                setSelectedCategory("All Posts")
              }}
            />
          ) : (
            filteredPosts.map((post, index) => (
              <BlogPostCard
                key={post.slug}
                post={post}
                index={index}
                showSponsored={index === 1}
              />
            ))
          )}
        </div>
      </div>

      {/* Right Sidebar — Newsletter */}
      <aside className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
        <div className="bh-card p-6">
          <div className="inline-flex p-2 rounded-lg bg-surface-hover text-muted-foreground mb-3">
            <Mail className="w-4 h-4" />
          </div>
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Newsletter</h2>
          <p className="mt-2 text-sm text-muted-foreground">Get technical updates and community news in your inbox.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value
              if (email) {
                toast.success("Subscribed!", {
                  description: "Check your email to confirm subscription.",
                })
                ;(e.currentTarget.elements.namedItem("email") as HTMLInputElement).value = ""
              }
            }}
            className="mt-5 space-y-3"
          >
            <input
              name="email"
              type="email"
              placeholder="your@email.com"
              aria-label="Email address"
              required
              className="bh-input"
            />
            <button
              type="submit"
              className="w-full bh-btn-primary text-sm"
            >
              Subscribe
            </button>
          </form>
          <p className="mt-3 text-[11px] text-muted-foreground text-center">We respect your privacy.</p>
        </div>
      </aside>
    </div>
  )
}
