import { notFound } from 'next/navigation';
import { getProjectDetails } from '@/lib/actions/project-details';
import ProjectDetailView from '@/components/projects/project-detail-view';
import RelatedLinks from '@/components/home/related-links';
import { blogPosts, initiatives, getRelatedByTags } from '@/lib/content';

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectDetails(id);

  if (!project) {
    notFound();
  }

  return (
    <div className="min-h-dvh bg-background pt-24 px-4 md:px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <ProjectDetailView project={project} />

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
