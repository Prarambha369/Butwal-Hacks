import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"

export interface RelatedLink {
  title: string
  description: string
  href: string
  image?: string | null
  meta?: string // e.g. date, category, status
}

export default function RelatedLinks({
  title = "You might also like",
  links,
}: {
  title?: string
  links: RelatedLink[]
}) {
  if (links.length === 0) return null

  return (
    <section className="border-t border-border pt-12 mt-16">
      <div className="mb-8">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2">
          /related
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-primary">
          {title}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group rounded-xl border border-border bg-surface p-5 transition-all duration-200 hover:shadow-sm hover:border-border/80"
          >
            {/* Cover image */}
            {link.image && (
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg mb-4 bg-background">
                <Image
                  src={link.image}
                  alt={link.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
              </div>
            )}

            {/* Meta label */}
            {link.meta && (
              <p className="text-[10px] font-mono font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                {link.meta}
              </p>
            )}

            <h3 className="text-base font-semibold text-primary group-hover:text-primary-red transition-colors leading-snug mb-1.5">
              {link.title}
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">
              {link.description}
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-primary-red transition-colors">
              <span>Read more</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
