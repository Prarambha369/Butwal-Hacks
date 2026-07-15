"use client"

import { cn } from "@/lib/utils"

/* ─── Base primitive ───────────────────────────────────────────────── */

interface SkeletonProps {
  className?: string
  variant?: "default" | "card" | "text" | "circle" | "image"
  count?: number
}

export function Skeleton({ className, variant = "default", count = 1 }: SkeletonProps) {
  const baseClasses = "animate-pulse bg-muted rounded-md"

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

/* ─── Card skeleton — generic card with icon area + title + lines ─── */

interface CardSkeletonProps {
  className?: string
  lines?: number
}

export function CardSkeleton({ className, lines = 2 }: CardSkeletonProps) {
  return (
    <div className={cn("bh-card p-6 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <div className="space-y-1.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={i === lines - 1 ? "h-3 w-2/3" : "h-3 w-full"} />
        ))}
      </div>
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  )
}

/* ─── Feed skeleton — list of avatar + text items ─────────────────── */

interface FeedSkeletonProps {
  count?: number
  className?: string
}

export function FeedSkeleton({ count = 5, className }: FeedSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-border">
          <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Table skeleton — parameterized rows + columns ───────────────── */

interface TableSkeletonProps {
  rows?: number
  columns?: number
}

/** Single table row skeleton */
function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === 0 ? "flex-1" : "w-20",
            i === columns - 1 && "ml-auto w-24",
          )}
        />
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="bh-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className={cn("h-3", i === 0 ? "w-24" : "w-16", i === columns - 1 && "ml-auto")} />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} columns={columns} />
      ))}
    </div>
  )
}
