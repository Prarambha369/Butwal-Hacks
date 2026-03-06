import type { Metadata } from "next"
import { buildPageMetadata } from "@/lib/seo"
import SiteHeader from "@/components/site-header"
import Footer from "@/components/footer"
import { Book, FileText, Code, Video, ExternalLink } from "lucide-react"

export const metadata: Metadata = buildPageMetadata({
  title: "Resources",
  description: "Learning resources, guides, and materials from Butwal Hacks community initiatives and programs.",
  path: "/resources",
})

export default function ResourcesPage() {
  const resourceCategories = [
    {
      title: "Learning Materials",
      icon: Book,
      description: "Guides, tutorials, and educational content from our workshops and programs.",
      items: [
        { name: "Getting Started with Web Development", available: false },
        { name: "Introduction to Git and GitHub", available: false },
        { name: "Building Your First Project", available: false },
      ],
      color: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
    },
    {
      title: "Documentation",
      icon: FileText,
      description: "Program documentation, initiative guides, and community resources.",
      items: [
        { name: "HackDay Butwal Participant Guide", available: false },
        { name: "Community Contribution Guidelines", available: false },
        { name: "Mentor Handbook", available: false },
      ],
      color: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
    },
    {
      title: "Code Examples",
      icon: Code,
      description: "Sample projects and code repositories from community initiatives.",
      items: [
        { name: "Starter Templates", link: "https://github.com/Prarambha369", available: true },
        { name: "Past Project Showcases", available: false },
        { name: "Community Contributions", available: false },
      ],
      color: "bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800",
    },
    {
      title: "Recordings & Media",
      icon: Video,
      description: "Recorded sessions, talks, and presentations from our events.",
      items: [
        { name: "Workshop Recordings", available: false },
        { name: "Community Talks", available: false },
        { name: "Event Highlights", available: false },
      ],
      color: "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800",
    },
  ]

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      
      <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <div className="text-center mb-12">
          <Book className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold font-heading text-foreground mb-4">Resources</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Access learning materials, documentation, and resources from Butwal Hacks community initiatives. 
            We&apos;re building a collection of practical resources to support your learning journey.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 mb-12">
          {resourceCategories.map((category) => {
            const Icon = category.icon
            return (
              <article 
                key={category.title} 
                className={`rounded-xl border p-6 ${category.color}`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-background/50 border border-border">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">{category.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                  </div>
                </div>
                
                <ul className="space-y-2">
                  {category.items.map((item, index) => (
                    <li key={index} className="flex items-center justify-between py-2 px-3 rounded-lg bg-background/50 border border-border/50">
                      <span className="text-sm text-foreground">{item.name}</span>
                      {item.available && item.link ? (
                        <a 
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 transition-colors"
                          aria-label={`View ${item.name}`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted">
                          Soon
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </article>
            )
          })}
        </div>

        <section className="border-t border-border pt-12">
          <h2 className="text-2xl font-semibold font-heading text-foreground mb-4">External Resources</h2>
          <p className="text-muted-foreground mb-6">
            Curated learning resources from around the web to support your development journey.
          </p>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <a
              href="https://developer.mozilla.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-lg border border-border bg-card hover:bg-muted transition-colors flex items-center justify-between group"
            >
              <div>
                <h3 className="font-semibold text-foreground">MDN Web Docs</h3>
                <p className="text-sm text-muted-foreground">Comprehensive web development documentation</p>
              </div>
              <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </a>

            <a
              href="https://www.freecodecamp.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-lg border border-border bg-card hover:bg-muted transition-colors flex items-center justify-between group"
            >
              <div>
                <h3 className="font-semibold text-foreground">freeCodeCamp</h3>
                <p className="text-sm text-muted-foreground">Learn to code with free tutorials</p>
              </div>
              <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </a>
          </div>
        </section>

        <section className="mt-12 p-6 rounded-xl border border-border bg-card">
          <h2 className="text-xl font-semibold font-heading text-foreground mb-3">Contributing Resources</h2>
          <p className="text-muted-foreground mb-4">
            Have resources, guides, or materials to share with the community? We welcome contributions 
            that can help others learn and grow.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            Share Resources
          </a>
        </section>
      </div>
      
      <Footer />
    </main>
  )
}
