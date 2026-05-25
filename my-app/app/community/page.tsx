import type { Metadata } from "next"
import { buildPageMetadata } from "@/lib/seo"
import SiteHeader from "@/components/site-header"
import Footer from "@/components/footer"
import { MessageSquare, Users, Github, Send } from "lucide-react"

export const metadata: Metadata = buildPageMetadata({
  title: "Community",
  description: "Join the Butwal Hacks community. Connect with fellow innovators, developers, and learners through our community platforms.",
  path: "/community",
})

export default function CommunityPage() {
  const communityLinks = [
    {
      name: "Discord",
      description: "Join discussions, share projects, and connect with the community in real-time.",
      icon: MessageSquare,
      href: "#",
      color: "bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800",
      buttonColor: "bg-indigo-600 hover:bg-indigo-700 text-white",
      available: false,
    },
    {
      name: "Telegram",
      description: "Get quick updates and participate in community conversations.",
      icon: Send,
      href: "#",
      color: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
      buttonColor: "bg-blue-600 hover:bg-blue-700 text-white",
      available: false,
    },
    {
      name: "GitHub",
      description: "Contribute to open-source projects, share code, and collaborate on initiatives.",
      icon: Github,
      href: "https://github.com/Prarambha369",
      color: "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800",
      buttonColor: "bg-gray-800 hover:bg-gray-900 text-white",
      available: true,
    },
  ]

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      
      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <div className="text-center mb-12">
          <Users className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold font-heading text-foreground mb-4">Join the Community</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect with fellow innovators, developers, and learners. Share ideas, collaborate on projects, 
            and be part of building a thriving tech community in Butwal and beyond.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-1 mb-12">
          {communityLinks.map((link) => {
            const Icon = link.icon
            return (
              <article 
                key={link.name} 
                className={`rounded-xl border p-6 ${link.color} transition-all hover:shadow-md`}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-background/50 border border-border">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-foreground mb-2">{link.name}</h2>
                    <p className="text-muted-foreground mb-4">{link.description}</p>
                    {link.available ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${link.buttonColor}`}
                      >
                        Join {link.name}
                      </a>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold bg-muted text-muted-foreground cursor-not-allowed">
                        Coming Soon
                      </div>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        <section className="border-t border-border pt-12">
          <h2 className="text-2xl font-semibold font-heading text-foreground mb-6">Community Guidelines</h2>
          <div className="space-y-4 text-muted-foreground">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Be Respectful</h3>
              <p>Treat all community members with respect. Harassment, discrimination, and abuse will not be tolerated.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Collaborate Openly</h3>
              <p>Share knowledge, help others learn, and work together on projects. We grow stronger as a community.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Stay On Topic</h3>
              <p>Keep discussions relevant to technology, innovation, and community initiatives.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Give Credit</h3>
              <p>Acknowledge contributions from others and respect intellectual property rights.</p>
            </div>
          </div>
        </section>

        <section className="mt-12 p-6 rounded-xl border border-border bg-card">
          <h2 className="text-xl font-semibold font-heading text-foreground mb-3">Want to Get Involved?</h2>
          <p className="text-muted-foreground mb-4">
            Whether you&apos;re a student, developer, designer, or just curious about technology, 
            there&apos;s a place for you in the Butwal Hacks community.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            Get in Touch
          </a>
        </section>
      </div>
      
      <Footer />
    </main>
  )
}
