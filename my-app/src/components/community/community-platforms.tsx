import {
  MessageSquare,
  Send,
  Github,
  Mail,
  ArrowUpRight,
} from "lucide-react"
import { communityLinks } from "@/lib/content"
import { FadeIn } from "@/components/home/shared-primitives"

const platformIcons: Record<string, typeof MessageSquare> = {
  MessageSquare,
  Send,
  Github,
  Mail,
}

const platformGradients: Record<string, string> = {
  Discord: "from-surface to-surface/50 border-border/40",
  Telegram: "from-status-blue/20 to-blue-800/10 border-status-blue/20",
  GitHub: "from-surface to-surface/50 border-border/40",
  Contact: "from-primary-red/10 to-red-800/10 border-primary-red/20",
}

const fallbackGradient = "from-surface to-surface/50 border-border/40"

export function CommunityPlatforms() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden" aria-label="Community Platforms">
      <FadeIn className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-14">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary-red/10 text-primary-red mb-4">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-primary">
            Where We Hang Out
          </h2>
          <p className="mt-3 text-secondary max-w-xl mx-auto">
            Join the conversation on your preferred platform. All channels are free and open to everyone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {communityLinks.map((link) => {
            const Icon = platformIcons[link.icon] || MessageSquare
            const gradient = platformGradients[link.name] || fallbackGradient
            return (
              <article
                key={link.name}
                className={`bh-card border p-6 bg-gradient-to-br ${gradient} transition-all hover:shadow-md group`}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-surface/30 border border-border/20 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-primary">{link.name}</h3>
                    <p className="mt-1 text-sm text-secondary/80 leading-relaxed">
                      {link.description}
                    </p>
                    {link.available ? (
                      <a
                        href={link.href}
                        target={link.href.startsWith("http") ? "_blank" : undefined}
                        rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary-red hover:text-primary-red transition-colors"
                      >
                        {link.name === "Contact" ? "Send message" : `Join ${link.name}`}{" "}
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground/50">
                        In Development
                      </span>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </FadeIn>
    </section>
  )
}
