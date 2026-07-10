import { SearchX } from "lucide-react"

interface NoResultsStateProps {
  searchQuery: string
  onClear: () => void
}

export function NoResultsState({ searchQuery, onClear }: NoResultsStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <SearchX className="h-12 w-12 text-muted-foreground" />
      <h3 className="text-lg font-semibold">No results found</h3>
      <p className="text-sm text-muted-foreground">
        No articles match &ldquo;{searchQuery}&rdquo;. Try a different search term or category.
      </p>
      <button
        onClick={onClear}
        className="text-sm font-medium text-primary hover:underline"
      >
        Clear filters
      </button>
    </div>
  )
}
