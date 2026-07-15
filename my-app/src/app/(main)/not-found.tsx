import Link from "next/link"
import type { Metadata } from "next"
import { ArrowLeft, Home } from "lucide-react"

export const metadata: Metadata = {
  title: "Page Not Found — Butwal Hacks",
  description: "The page you are looking for does not exist or has been moved.",
}

export default function MainNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        {/* Large 404 */}
        <p className="text-[140px] font-black leading-none text-primary/5 select-none">
          404
        </p>

        <div className="space-y-2 -mt-6">
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
            className="inline-flex items-center gap-2 rounded-full bg-primary-red px-6 py-2.5 text-sm font-bold text-white hover:bg-deep-red transition-all"
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
