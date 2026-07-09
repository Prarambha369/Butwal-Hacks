import { notFound } from 'next/navigation';
import { getProgramBySlug, blogPosts, initiatives, getRelatedByTags, programs } from '@/lib/content';
import ProgramDetailClient from '@/components/programs/program-detail-client';
import RelatedLinks from '@/components/home/related-links';

export const dynamic = "force-static";

export function generateStaticParams() {
  return programs.map((program) => ({
    slug: program.slug,
  }));
}

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ProgramDetailPage({ params }: Props) {
  const { slug } = await params;
  const program = getProgramBySlug(slug);

  if (!program) {
    notFound();
  }

  return (
    <>
      <ProgramDetailClient program={program} />
      <div className="max-w-6xl mx-auto px-6 md:px-20 pb-20">
        <RelatedLinks
          title="Continue Reading"
          links={[
            ...getRelatedByTags(blogPosts, program.tags).map((p) => ({
              title: p.title,
              description: p.excerpt,
              href: `/blog/${p.slug}`,
              image: p.cover_image,
              meta: p.publishedAt,
            })),
            ...getRelatedByTags(
              initiatives.filter((i) => i.status === "active"),
              program.tags,
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
    </>
  );
}
