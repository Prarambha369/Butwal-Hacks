import React from 'react';
import Image from 'next/image';
import { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import { GlassBadge } from '@/components/ui/glass-badge';
import { blogPosts } from '@/lib/content';
import { notFound } from 'next/navigation';

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
    <div className="min-h-screen pt-32 pb-24 px-6 md:px-20 bg-background text-primary">
      <div className="max-w-3xl mx-auto">
        {/* Blog Header */}
        <div className="space-y-6 mb-12">
          <GlassBadge>Engineering Log</GlassBadge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-primary leading-[1.05]">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-secondary font-mono text-sm">
            <span>{post.publishedAt}</span>
            <span>•</span>
            <span>5 min read</span>
            <span>•</span>
            <span className="text-bh-red-500">By Butwal Hacks Team</span>
          </div>
        </div>

        {/* Featured Image */}
        <div className="lg-concentric-inner aspect-video relative rounded-[32px] overflow-hidden mb-12">
          <Image 
            src="https://images.unsplash.com/photo-1517245386807-bb43f82c-crop&q=80&w=1200" 
            alt={post.title} 
            fill
            className="object-cover"
          />
        </div>

        {/* Article Content */}
        <div className="space-y-8 text-lg leading-relaxed text-secondary">
          <p>{post.excerpt}</p>
          
          <h2 className="text-2xl font-semibold text-primary leading-[1.2]">The Decentralization Thesis</h2>
          <p>
            We believe that the proximity to the problem is the greatest catalyst for 
            the solution. By building a regional hub in Butwal, we are creating a 
            space where builders don&apos;t just learn to code—they learn to solve.
          </p>
          
          <div className="p-6 lg-surface rounded-[24px] border-l-4 border-bh-red-500 my-8">
            <p className="italic text-primary font-medium">
              &quot;The goal is not to create more developers, but to create more problem-solvers 
              who happen to use code as their primary tool.&quot;
            </p>
          </div>

          <h2 className="text-2xl font-semibold text-primary leading-[1.2]">Infrastructure as a Service</h2>
          <p>
            Through our fellowships and hackathons, we provide the high-bandwidth 
            internet, mentorship, and community that youth in the region often lack. 
            This removes the friction from the creative process.
          </p>

          <div className="bg-surface-grey p-6 rounded-[20px] font-mono text-sm leading-loose overflow-x-auto">
            <span className="text-status-blue">const</span> <span className="text-status-yellow">innovation</span> = (youth, tools) =&gt; {'{'} <br />
            &nbsp;&nbsp;<span className="text-secondary">{/* Decentralize education */}</span> <br />
            &nbsp;&nbsp;<span className="text-status-blue">return</span> youth.empower(tools).build(region.lumbini); <br />
            {'}'};
          </div>
        </div>
      </div>
    </div>
  );
}
