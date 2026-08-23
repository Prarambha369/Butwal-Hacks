import Image from 'next/image'
import Link from 'next/link'
import { Heart, ArrowUpRight, Monitor } from 'lucide-react'
import { cloudinaryUrl } from '@/lib/utils'

interface FeaturedProject {
  id: string
  title: string
  description: string
  cover_image: string | null
  tech_stack: unknown
  project_likes: Array<{ count?: number } | null> | null
}

export default function FeaturedProjects({ projects }: { projects: FeaturedProject[] }) {
  if (projects.length === 0) {
    return (
      <section className="py-16 md:py-24 bg-surface border-b border-border">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center">
              <Monitor className="w-8 h-8 text-muted-foreground opacity-20" />
            </div>
            <p className="text-sm text-muted-foreground font-mono opacity-60">
              No community projects to feature yet. The first builds will appear here.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Bento layout: pick the most-liked project as the hero (spans 2 cols)
  const sorted = [...projects].sort((a, b) => {
    const aLikes = Array.isArray(a.project_likes) ? (a.project_likes[0] as { count?: number } | undefined)?.count ?? 0 : 0
    const bLikes = Array.isArray(b.project_likes) ? (b.project_likes[0] as { count?: number } | undefined)?.count ?? 0 : 0
    return bLikes - aLikes
  })
  const hero = sorted[0]
  const rest = sorted.slice(1)

  return (
    <section className="py-16 md:py-24 bg-surface border-b border-border">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border mb-4">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary-red" />
            <span className="text-[10px] font-mono font-semibold text-muted-foreground tracking-tight">community projects</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-primary">
            Featured Builds
          </h2>
          <p className="mt-3 text-secondary max-w-2xl mx-auto text-sm">
            Projects built by the community during hackathons and events.
          </p>
        </div>

        {/* Bento grid — asymmetric 2+1 layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(280px,auto)]">
          {/* Hero project — spans 2 columns */}
          {hero && (
            <ProjectCard
              project={hero}
              className="md:col-span-2 md:row-span-2"
              variant="hero"
            />
          )}

          {/* Side projects — single column each */}
          {rest.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              className=""
              variant="compact"
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function ProjectCard({
  project,
  className,
  variant,
}: {
  project: FeaturedProject
  className?: string
  variant: 'hero' | 'compact'
}) {
  const likes = Array.isArray(project.project_likes)
    ? (project.project_likes[0] as { count?: number } | undefined)?.count ?? 0
    : 0
  const techStack = (project.tech_stack ?? []) as string[]
  const coverUrl = cloudinaryUrl(project.cover_image, variant === 'hero' ? 800 : 600)

  return (
    <Link
      href={`/projects/${project.id}`}
      className={`bh-card-interactive overflow-hidden group flex flex-col ${className || ''}`}
    >
      {/* Cover Image */}
      <div className={`relative w-full overflow-hidden bg-background ${variant === 'hero' ? 'aspect-[21/9] md:aspect-[2/1]' : 'aspect-video'}`}>
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={project.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes={variant === 'hero' ? '(max-width: 768px) 100vw, 66vw' : '(max-width: 768px) 100vw, 33vw'}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl md:text-7xl font-bold text-secondary/10">
              {(project.title ?? '?').charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Overlay gradient on hero for text readability */}
        {variant === 'hero' && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        )}
      </div>

      {/* Content */}
      <div className={`flex flex-col ${variant === 'hero' ? 'p-6 md:p-8 space-y-4' : 'p-5 space-y-3'} flex-1`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className={`font-semibold text-primary group-hover:text-primary-red transition-colors ${variant === 'hero' ? 'text-2xl md:text-3xl' : 'text-lg'} line-clamp-1`}>
              {project.title}
            </h3>
            {variant === 'hero' && (
              <p className="mt-2 text-sm text-text-secondary line-clamp-2 leading-relaxed">
                {project.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-secondary shrink-0">
            <Heart className="h-4 w-4" />
            <span className="text-xs font-mono">{likes}</span>
          </div>
        </div>

        {variant === 'compact' && (
          <p className="text-sm text-secondary line-clamp-2 leading-relaxed flex-1">
            {project.description}
          </p>
        )}

        {/* Tech stack pills */}
        {techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {techStack.slice(0, variant === 'hero' ? 5 : 3).map((tech) => (
              <span
                key={tech}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-background text-secondary"
              >
                {tech}
              </span>
            ))}
            {techStack.length > (variant === 'hero' ? 5 : 3) && (
              <span className="text-[10px] text-secondary">
                +{techStack.length - (variant === 'hero' ? 5 : 3)}
              </span>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
          <span className="text-xs font-medium text-primary-red opacity-0 group-hover:opacity-100 transition-opacity">
            View Details →
          </span>
          <span className="text-xs font-medium text-primary-red group-hover:opacity-0 transition-opacity">
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}
