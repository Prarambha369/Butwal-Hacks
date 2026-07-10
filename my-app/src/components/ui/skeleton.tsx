"use client"

import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
  variant?: "default" | "card" | "text" | "circle" | "image"
  count?: number
}

export function Skeleton({ className, variant = "default", count = 1 }: SkeletonProps) {
  const baseClasses = "animate-pulse bg-surface/50 rounded-md bg-gradient-to-r from-muted via-muted/70 to-muted"

  const variantClasses = {
    default: "h-4 w-full",
    card: "h-48 w-full",
    text: "h-4 w-3/4",
    circle: "h-12 w-12 rounded-full",
    image: "h-40 w-full",
  }

  const items = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={cn(baseClasses, variantClasses[variant], className)}
    />
  ))

  if (count === 1) return items[0]
  return <div className="space-y-2">{items}</div>
}

export function BlogCardSkeleton() {
  return (
    <div className="border-b border-glass pb-8 space-y-4">
      {/* Meta row: date and read time */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      {/* Title */}
      <Skeleton className="h-10 w-3/4" />
      {/* Excerpt lines */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-5/6" />
        <Skeleton className="h-5 w-4/6" />
      </div>
      {/* Read more link */}
      <Skeleton className="h-6 w-28" />
    </div>
  )
}

export function BlogGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <BlogCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton variant="text" className="h-12 w-1/2" />
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <div className="space-y-4">
          <Skeleton variant="card" className="h-40" />
          <Skeleton variant="card" className="h-32" />
        </div>
        <div className="space-y-6">
          <BlogCardSkeleton />
          <BlogCardSkeleton />
          <BlogCardSkeleton />
        </div>
      </div>
    </div>
  )
}
