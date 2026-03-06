import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function ReturnHomeLink() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-card-foreground hover:bg-muted"
    >
      <ArrowLeft className="h-4 w-4" />
      Return Home
    </Link>
  )
}
