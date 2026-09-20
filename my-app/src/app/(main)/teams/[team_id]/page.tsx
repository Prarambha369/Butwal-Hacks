import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CalendarDays, Camera } from 'lucide-react';
import { createServiceClient } from '@/utils/supabase';
import TeamPortfolio from '@/components/teams/team-portfolio';
import RelatedLinks from '@/components/home/related-links';
import { blogPosts, initiatives, getRelatedByTags } from '@/lib/content';
import { buildPageMetadata } from "@/lib/seo"


export async function generateMetadata() {
  return buildPageMetadata({title: "Team", description: "A student hackathon team at Butwal Hacks. See members and their projects.", path: "/teams", keywords: []});
}

export default async function TeamPortfolioPage({ params }: { params: Promise<{ team_id: string }> }) {
  const { team_id } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('teams')
    .select('id, event_id, events ( title, slug )')
    .eq('id', team_id)
    .single();

  if (error || !data) {
    notFound();
  }

  const team = data as unknown as {
    id: string;
    events: { title: string; slug: string | null } | Array<{ title: string; slug: string | null }> | null;
  };
  const event = Array.isArray(team.events) ? team.events[0] ?? null : team.events;

  return (
    <div className="min-h-dvh bg-background text-primary pt-24 pb-20 px-4">
      <div className="max-w-6xl mx-auto space-y-12">
        {event && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border bg-surface px-5 py-4">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-primary">
              <CalendarDays className="w-4 h-4 text-primary-red" />
              {event.slug ? (
                <Link href={`/events/${event.slug}`} className="hover:text-primary-red transition-colors">
                  {event.title}
                </Link>
              ) : (
                event.title
              )}
            </span>
            <Link
              href="/gallery"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary-red transition-colors"
            >
              <Camera className="w-3.5 h-3.5" /> Event photos
            </Link>
          </div>
        )}
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
