import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import TeamPortfolio from '@/components/teams/team-portfolio';
import RelatedLinks from '@/components/home/related-links';
import { blogPosts, initiatives, getRelatedByTags } from '@/lib/content';

export default async function TeamPortfolioPage({ params }: { params: Promise<{ team_id: string }> }) {
  const { team_id } = await params;
  const supabase = await createClient();

  const { data: team, error } = await supabase
    .from('teams')
    .select('id')
    .eq('id', team_id)
    .single();

  if (error || !team) {
    notFound();
  }

  return (
    <div className="min-h-dvh bg-background text-primary pt-24 pb-20 px-4">
      <div className="max-w-6xl mx-auto space-y-12">
        <TeamPortfolio teamId={team_id} />

        <RelatedLinks
          title="Continue Reading"
          links={[
            ...getRelatedByTags(blogPosts, []).map((p) => ({
              title: p.title,
              description: p.excerpt,
              href: `/blog/${p.slug}`,
              image: p.cover_image,
              meta: p.publishedAt,
            })),
            ...getRelatedByTags(
              initiatives.filter((i) => i.status === "active"),
              [],
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
