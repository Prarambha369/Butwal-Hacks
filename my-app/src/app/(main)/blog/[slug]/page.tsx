import Image from 'next/image';
import { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import { blogPosts, events, getRelatedByTags } from '@/lib/content';
import { notFound } from 'next/navigation';
import RelatedLinks from '@/components/home/related-links';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find(p => p.slug === slug);
  
  if (!post) {
    return buildPageMetadata({
      title: 'Blog Post Not Found',
      description: 'The requested blog post could not be found.',
      path: `/blog/${slug}`,
    });
  }

  return buildPageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${slug}`,
  });
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogPosts.find(p => p.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-dvh pt-32 pb-24 px-6 md:px-20 bg-background">
      <div className="max-w-3xl mx-auto">
        {/* Blog Header */}
        <div className="space-y-6 mb-12">
          <span className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-[10px] font-medium text-muted-foreground">
            Engineering Log
          </span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-primary leading-[1.05]">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-muted-foreground font-mono text-sm">
            <span>{post.publishedAt}</span>
            <span>•</span>
            <span>5 min read</span>
            <span>•</span>
            <span className="text-primary-red">By Butwal Hacks Team</span>
          </div>
        </div>

        {/* Featured Image */}
        <div className="relative aspect-video w-full overflow-hidden rounded-xl mb-12 border border-border/30 bg-surface">
          <Image 
            src={post.cover_image || "https://images.unsplash.com/photo-1517245386807-bb43f82c-crop&q=80&w=1200"} 
            alt={post.title} 
            fill
            className="object-cover transition-transform duration-500 hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 800px"
            priority
          />
        </div>

        {/* Related links: other posts + events matched by tags */}
        <RelatedLinks
          title="Continue Reading"
          links={[
            ...getRelatedByTags(blogPosts, post.tags, { excludeSlug: slug }).map((p) => ({
              title: p.title,
              description: p.excerpt,
              href: `/blog/${p.slug}`,
              image: p.cover_image,
              meta: p.publishedAt,
            })),
            ...getRelatedByTags(events, post.tags, { max: 1 }).map((e) => ({
              title: e.title,
              description: e.summary,
              href: `/events/${e.slug}`,
              meta: e.status === 'completed' ? 'Past Event' : 'Upcoming',
            })),
          ]}
        />

        {/* Article Content */}
        <div className="space-y-8 text-lg leading-relaxed text-text-body">
          <p>{post.excerpt}</p>
          
          <h2 className="text-2xl font-bold text-primary leading-[1.2]">The Decentralization Thesis</h2>
          <p>
            We believe that the proximity to the problem is the greatest catalyst for 
            the solution. By building a regional hub in Butwal, we are creating a 
            space where builders don&apos;t just learn to code—they learn to solve.
          </p>
          
          <div className="p-6 rounded-xl border border-primary-red/30 bg-primary-red/5 my-8">
            <p className="italic text-primary font-medium">
              &quot;The goal is not to create more developers, but to create more problem-solvers 
              who happen to use code as their primary tool.&quot;
            </p>
          </div>

          <h2 className="text-2xl font-bold text-primary leading-[1.2]">Infrastructure as a Service</h2>
          <p>
            Through our fellowships and hackathons, we provide the high-bandwidth 
            internet, mentorship, and community that youth in the region often lack. 
            This removes the friction from the creative process.
          </p>

          <div className="bg-surface p-6 rounded-xl border border-border font-mono text-sm leading-loose overflow-x-auto">
            <span className="text-status-blue">const</span> <span className="text-status-yellow">innovation</span> = (youth, tools) =&gt; {'{'} <br />
            &nbsp;&nbsp;<span className="text-muted-foreground">{/* Decentralize education */}</span> <br />
            &nbsp;&nbsp;<span className="text-status-blue">return</span> youth.empower(tools).build(region.lumbini); <br />
            {'}'};
          </div>
        </div>
      </div>
    </div>
  );
}
