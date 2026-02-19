import { ArrowRight, Landmark } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

export default function Hero() {
  return (
    <header className="px-4 py-20 sm:py-24 border-b border-border bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-4xl">
          <Badge className="mb-5 inline-flex items-center gap-2 border-2 border-secondary bg-secondary/10 text-secondary">
            <Landmark className="w-4 h-4" />
            Non-Profit Foundation Initiative
          </Badge>
          <div className="flex items-center gap-4 mb-6">
          <Image
            src="/logo.png"
            alt="Butwal Hacks Logo"
            width={80}
            height={80}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-border"
            priority
          />
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Butwal Hacks Foundation</p>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-heading text-foreground leading-tight">
            Butwal Hacks: Decentralizing Nepal&apos;s Tech Innovation.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl">
            A non-profit initiative empowering youth in Butwal and Rupandehi to foster a thriving regional hub for
            technology and collaboration.
          </p>

          <nav className="mt-8 flex flex-wrap gap-3" aria-label="Primary">
            <a
              href="#what-we-do"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Explore Programs
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#roadmap"
              className="rounded-md border border-border bg-card px-5 py-2.5 text-sm font-semibold text-card-foreground hover:bg-muted"
            >
              View Roadmap
            </a>
          </nav>
        </div>
      </div>
    </header>
  )
}
