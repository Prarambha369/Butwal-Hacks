import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CalendarDays, Users } from 'lucide-react';
import { getProjectDetails } from '@/lib/actions/project-details';
import { getLatestImpactReport } from '@/lib/actions/impact';
import ProjectDetailView from '@/components/projects/project-detail-view';
import ProjectImpactSection from '@/components/projects/project-impact-section';
import RelatedLinks from '@/components/home/related-links';
import { blogPosts, initiatives, getRelatedByTags } from '@/lib/content';
import { buildPageMetadata } from "@/lib/seo"


export async function generateMetadata() {
  return buildPageMetadata({title: "Project", description: "A student-built project from a Butwal Hacks hackathon. See how it was made.", path: "/projects", keywords: []});
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectDetails(id);

  if (!project) {
    notFound();
  }

  const impact = await getLatestImpactReport(id);

  const event = (project as {
    events?: { title: string; slug: string | null } | Array<{ title: string; slug: string | null }> | null;
  }).events;
  const eventLink = Array.isArray(event) ? event[0] ?? null : event;
  const team = (project as {
    teams?: { id: string; name: string } | Array<{ id: string; name: string }> | null;
  }).teams;
  const teamLink = Array.isArray(team) ? team[0] ?? null : team;

  return (
    <div className="min-h-dvh bg-background pt-24 px-4 md:px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        {(eventLink || teamLink) && (
          <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {eventLink && (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <CalendarDays className="w-4 h-4 text-primary-red" />
                Built at{" "}
                {eventLink.slug ? (
                  <Link href={`/events/${eventLink.slug}`} className="font-bold text-primary hover:text-primary-red transition-colors">
                    {eventLink.title}
                  </Link>
                ) : (
                  <span className="font-bold text-primary">{eventLink.title}</span>
                )}
              </span>
            )}
            {teamLink && (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Users className="w-4 h-4 text-status-blue" />
                by{" "}
                <Link href={`/teams/${teamLink.id}`} className="font-bold text-primary hover:text-primary-red transition-colors">
                  {teamLink.name}
                </Link>
              </span>
            )}
          </div>
        )}
        <ProjectDetailView project={project} />
        <ProjectImpactSection report={impact} />

        <RelatedLinks
          title="Continue Reading"
          links={[
            // Projects have no tags — show all blog posts (tag-based fallback)
            ...getRelatedByTags(blogPosts, []).map((p) => ({
              title: p.title,
              description: p.excerpt,
              href: `/blog/${p.slug}`,
              image: p.cover_image,
              meta: p.publishedAt,
            })),
            ...getRelatedByTags(
              initiatives.filter((i) => i.status === "active"),
              (project.title ?? "").split(" "), // derive loose tags from project title
              { max: 2 },
            ).map((i) => ({
              title: i.name,
              description: i.summary,
              href: `/initiatives/${i.slug}`,
              meta: "Active Initiative",
            })),
          ]}
        />
      </div>
    </div>
  );
}
