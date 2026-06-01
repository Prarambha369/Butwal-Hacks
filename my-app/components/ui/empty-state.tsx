"use client"

import { FileSearch, Search, AlertCircle, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  title: string
  description: string
  icon?: LucideIcon
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
  variant?: "default" | "search" | "error"
}

const iconMap: Record<string, LucideIcon> = {
  default: FileSearch,
  search: Search,
  error: AlertCircle,
}

export function EmptyState({
  title,
  description,
  icon: IconProp,
  action,
  className,
  variant = "default",
}: EmptyStateProps) {
  const Icon = IconProp || iconMap[variant]

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center",
        className
      )}
    >
      <div className="mb-4 rounded-full bg-primary/10 p-4">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="mt-6" variant="default">
          {action.label}
        </Button>
      )}
    </div>
  )
}

export function NoResultsState({
  searchQuery,
  onClear,
}: {
  searchQuery: string
  onClear: () => void
}) {
  return (
    <EmptyState
      variant="search"
      title="No results found"
      description={`We couldn't find any posts matching "${searchQuery}". Try adjusting your search or filters.`}
      action={{ label: "Clear search", onClick: onClear }}
    />
  )
}
