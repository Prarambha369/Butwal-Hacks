import Link from "next/link"

type BreadcrumbItem = {
  label: string
  href?: string
}

type BreadcrumbsProps = {
  items: BreadcrumbItem[]
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
              )}
              {!isLast ? <span className="text-muted-foreground">/</span> : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
