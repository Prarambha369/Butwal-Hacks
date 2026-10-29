import Link from "next/link"
import type { Metadata } from "next"
import { ArrowLeft, Home } from "lucide-react"
import { Ballu } from "@/components/mascot/ballu"

export const metadata: Metadata = {
  title: "Page Not Found — Butwal Hacks",
  description: "The page you are looking for does not exist or has been moved.",
}

export default function MainNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        {/* Decorative watermark. Rendered as ::before content, not a text
            node: a ghost numeral at 5% opacity can never clear WCAG's 3:1
            large-text threshold (it is decoration, and 1.4.3 exempts pure
            decoration), and putting it in a text node makes automated audits
            flag it forever. The h1 below already announces "Page not found". */}
        <p
          aria-hidden="true"
          className="text-[140px] font-black leading-none text-primary/5 select-none before:content-['404']"
        />

        <div className="space-y-2 -mt-6">
          <Ballu emotion="question" size={120} />
          <h1 className="text-2xl font-bold text-primary">
            Page not found
          </h1>
          <p className="text-sm text-secondary leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Check the URL or navigate back to familiar ground.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-bh-red-action px-6 py-2.5 text-sm font-bold text-white hover:bg-deep-red transition-all"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-2.5 text-sm font-bold text-primary hover:bg-surface-hover transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Explore
          </Link>
        </div>
      </div>
    </div>
  )
}
