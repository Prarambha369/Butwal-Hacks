"use client"

import { useState, useMemo, useRef, useEffect, memo } from "react"
import Link from "next/link"
import { CalendarDays, Clock3, Search, X, ArrowRight } from "lucide-react"
import { blogPosts, type BlogPost } from "@/lib/content"
import { validateSearchInput, sanitizeInput } from "@/lib/validation"
import { BlogCardSkeleton } from "@/components/ui/skeleton"
import { NoResultsState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const categories = ["All Posts", "Development", "Community", "Events"]
const tags = ["#react", "#opensource", "#hackathon", "#backend", "#nepaltech"]

// Animated blog post card with entrance animation
const BlogPostCard = memo(function BlogPostCard({
  post,
  index,
  showSponsored,
}: {
  post: BlogPost
  index: number
  showSponsored: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion || !ref.current) return

    // Set initial state
    ref.current.style.opacity = "0"
    ref.current.style.transform = "translateY(24px)"

    import("animejs").then(({ animate }) => {
      animate(ref.current!, {
        opacity: [0, 1],
        translateY: [24, 0],
        duration: 600,
        delay: index * 120,
        ease: "outQuad",
      })
    })
  }, [index])

  return (
    <div ref={ref}>
      <article className="group border-b border-border pb-8 transition-colors">
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
        <h2 className="mt-4 text-2xl sm:text-3xl font-bold font-heading leading-tight text-foreground group-hover:text-primary transition-colors duration-300">
          <Link href={`/blog/${post.slug}`} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm">
            {post.title}
          </Link>
        </h2>

        {/* Excerpt */}
        <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
          {post.excerpt}
        </p>

        {/* Read more link with arrow animation */}
        <Link
          href={`/blog/${post.slug}`}
          className="mt-5 inline-flex items-center gap-2 text-base font-semibold text-primary hover:text-primary/80 transition-colors duration-300 group/link"
        >
          Read More
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-1" />
        </Link>
      </article>

      {/* Sponsored card after second post */}
      {showSponsored && (
        <aside className="my-8 rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Sponsored</p>
          <h3 className="mt-2 text-xl sm:text-2xl font-semibold font-heading text-foreground">
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
  const headerRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Entrance animation for header and sidebar
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) return

    const elements = [headerRef.current, sidebarRef.current].filter(Boolean)
    if (elements.length === 0) return

    import("animejs").then(({ animate, stagger }) => {
      animate(elements, {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 700,
        delay: stagger(100),
        ease: "outQuad",
      })
    })
  }, [])

  // Debounced search with validation
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value

    // Validate input
    const validation = validateSearchInput(rawValue)
    if (!validation.valid && rawValue.length > 0) {
      toast.error(validation.error, { duration: 2000 })
      return
    }

    // Sanitize and set
    const sanitized = sanitizeInput(rawValue)
    setSearchQuery(sanitized)
    setIsLoading(true)

    // Simulate loading for better UX
    setTimeout(() => {
      setIsLoading(false)
    }, 300)
  }

  const clearSearch = () => {
    setSearchQuery("")
    toast.success("Search cleared")
  }

  // Filter posts based on search and category
  const filteredPosts = useMemo(() => {
    let posts = blogPosts

    // Category filter
    if (selectedCategory !== "All Posts") {
      posts = posts.filter((post) => {
        if (selectedCategory === "Development") return post.slug.includes("tech")
        if (selectedCategory === "Community") return post.slug.includes("mentorship")
        return true
      })
    }

    // Search filter
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
       {/* Left Sidebar — improved styling */}
       <aside ref={sidebarRef} className="space-y-6 rounded-xl border border-border bg-card p-6 xl:sticky xl:top-24 xl:h-fit shadow-sm hover:shadow-md transition-shadow">
         <div>
           <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Categories</h2>
           <ul className="mt-5 space-y-2">
             {categories.map((category) => (
               <li key={category}>
                 <button
                   type="button"
                   onClick={() => {
                     setSelectedCategory(category)
                     if (category !== "All Posts") {
                       toast.success(`Showing ${category} posts`)
                     }
                   }}
                   className={cn(
                     "w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                     selectedCategory === category
                       ? "bg-primary text-primary-foreground shadow-md"
                       : "text-foreground/70 hover:bg-muted hover:text-foreground"
                   )}
                 >
                   {category}
                 </button>
               </li>
             ))}
           </ul>
         </div>

         <div className="pt-6 border-t border-border">
           <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Trending Tags</h2>
           <div className="mt-5 flex flex-wrap gap-2">
             {tags.map((tag) => (
               <button
                 key={tag}
                 onClick={() => {
                   setSearchQuery(tag.replace("#", ""))
                   toast.success(`Searching for ${tag}`)
                 }}
                 className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
               >
                 {tag}
               </button>
             ))}
           </div>
         </div>
       </aside>

       {/* Main Content */}
       <div className="min-w-0">
         {/* Header — improved typography hierarchy */}
         <div ref={headerRef}>
           <h1 className="text-5xl font-black tracking-tight text-foreground sm:text-6xl">Blog</h1>
           <p className="mt-5 max-w-3xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
             Technical insights, community spotlights, and updates from Butwal Hacks.
             Discover how we&apos;re building a tech movement in Western Nepal.
           </p>
         </div>

         {/* Search Bar — improved UX */}
         <div className="mt-10 relative group">
           <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
           <input
             type="text"
             placeholder="Search by title, topic, or keyword..."
             value={searchQuery}
             onChange={handleSearchChange}
             className="w-full rounded-xl border-2 border-border bg-card py-4 pl-12 pr-11 text-base text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all duration-200 shadow-sm hover:border-border/80"
             aria-label="Search blog posts"
             maxLength={100}
           />
           {searchQuery ? (
             <button
               onClick={clearSearch}
               className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
               aria-label="Clear search"
               title="Clear search"
             >
               <X className="h-5 w-5" />
             </button>
           ) : null}
         </div>

        {/* Results bar */}
        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Loading...
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
                toast.success("Filters cleared")
              }}
              className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Posts List */}
        <div className="mt-8 space-y-8" key={animationKey}>
          {isLoading ? (
            <div className="space-y-8">
              <BlogCardSkeleton />
              <BlogCardSkeleton />
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

       {/* Right Sidebar — newsletter form improved */}
       <aside className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
         <div className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
           <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Newsletter</h2>
           <p className="mt-3 text-sm text-muted-foreground">Get technical updates and community news in your inbox.</p>
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
             <div>
               <input
                 name="email"
                 type="email"
                 placeholder="your@email.com"
                 aria-label="Email address"
                 required
                 className="w-full rounded-lg border-2 border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all hover:border-border/80"
               />
             </div>
             <button
               type="submit"
               className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 transition-all shadow-sm hover:shadow-md"
             >
               Subscribe
             </button>
           </form>
           <p className="mt-3 text-xs text-muted-foreground text-center">We respect your privacy.</p>
         </div>
       </aside>
    </div>
  )
}
