"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, Filter, Code2, ExternalLink, Github, ShieldCheck, Heart, Tags } from 'lucide-react';
import { RoseSpinner } from '@/components/ui/rose-loader';
import { createClient } from '@/utils/supabase/client';
import type { Project } from '@/lib/supabase-types';
import { cn, cloudinaryUrl } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';
import LikeButton from '@/components/projects/like-button';

interface ProjectWithLikes extends Project {
  project_likes?: { count: number }[];
}

const PAGE_SIZE = 24;

/** Map categories to accent colors for the filter pills */
const CATEGORY_COLORS: Record<string, string> = {
  'Web App': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Mobile App': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'AI/ML': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Data Science': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'Blockchain': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Hardware/IoT': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'DevOps/Tools': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'Game Dev': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  'Open Source Tool': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  'Other': 'bg-surface/10 text-secondary border-glass',
};

export default function ProjectGrid() {
  const [allProjects, setAllProjects] = useState<ProjectWithLikes[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'trending' | 'top'>('newest');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const supabase = createClient();

  // Get unique tech stacks — fetch only the column we need
  const [allTech, setAllTech] = useState<string[]>([]);
  useEffect(() => {
    const loadTech = async () => {
      const { data } = await supabase
        .from('projects')
        .select('tech_stack');
      const techSet = new Set<string>();
      data?.forEach(p => p.tech_stack?.forEach((t: string) => techSet.add(t)));
      setAllTech(Array.from(techSet).sort());
    };
    loadTech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch all matching projects once (no server-side pagination with filters in this version)
  // ponytail: fetches all matching projects (up to ~100) and paginates client-side.
  // If the DB grows beyond a few hundred projects, switch to server-side cursor pagination.
  const fetchProjects = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('projects')
        .select('*, project_likes(count)');

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }
      if (selectedTech) {
        query = query.contains('tech_stack', [selectedTech]);
      }
      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      // Server-side ordering for newest; trending/top sorted client-side
      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      const results = (data || []) as ProjectWithLikes[];

      // Client-side sort for trending/top (needs likes count)
      if (sortBy === 'trending') {
        results.sort((a, b) => {
          const aLikes = a.project_likes?.[0]?.count ?? 0;
          const bLikes = b.project_likes?.[0]?.count ?? 0;
          return bLikes - aLikes;
        });
      } else if (sortBy === 'top') {
        // ponytail: 'top' sorts by likes first, then creation date as tiebreaker
        results.sort((a, b) => {
          const aLikes = a.project_likes?.[0]?.count ?? 0;
          const bLikes = b.project_likes?.[0]?.count ?? 0;
          if (bLikes !== aLikes) return bLikes - aLikes;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      }

      setAllProjects(results);
      setHasMore(results.length > PAGE_SIZE);
      setPage(0);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => fetchProjects(), 300);
    return () => clearTimeout(debounceTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedTech, selectedCategory, sortBy]);

  // Slice for client-side pagination
  const displayedProjects = allProjects.slice(0, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(allProjects.length / PAGE_SIZE);

  return (
    <div className="space-y-8">
      {/* Results count bar */}
      {!loading && allProjects.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-secondary font-mono">
          <div className="w-1.5 h-1.5 rounded-full bg-bh-red-500" />
          {allProjects.length} project{allProjects.length !== 1 ? 's' : ''} found
          {(searchQuery || selectedTech || selectedCategory) && (
            <button
              onClick={() => { setSearchQuery(''); setSelectedTech(null); setSelectedCategory(null); }}
              className="ml-2 px-2 py-0.5 rounded-full bg-surface/10 hover:bg-surface/20 text-secondary hover:text-primary transition-colors text-[10px]"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Filters Section */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-surface/10 p-4 rounded-2xl border border-glass">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
          <input 
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-glass focus:border-bh-red-500 outline-none transition-all text-sm"
            placeholder="Search projects by title..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col gap-4 w-full">
          {/* Row 1: Sort + Tech filters */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="flex items-center gap-2 mr-4 border-r border-glass pr-4 shrink-0">
              <span className="text-[10px] font-mono text-secondary uppercase tracking-widest shrink-0">Sort:</span>
              <select 
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'newest' | 'trending' | 'top')}
                className="bg-transparent text-xs font-bold outline-none cursor-pointer hover:text-bh-red-500 transition-colors"
              >
                <option value="newest" className="bg-background">Newest</option>
                <option value="trending" className="bg-background">Trending 🔥</option>
                <option value="top" className="bg-background">Top Rated</option>
              </select>
            </div>
            <Filter className="w-4 h-4 text-secondary mr-2 shrink-0" />
            <button 
              onClick={() => setSelectedTech(null)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                !selectedTech ? "bg-bh-red-500 text-primary" : "bg-surface/10 text-secondary hover:bg-background/20"
              )}
            >
              All
            </button>
            {allTech.map(tech => (
              <button 
                key={tech}
                onClick={() => setSelectedTech(tech)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                  selectedTech === tech ? "bg-bh-red-500 text-primary" : "bg-surface/10 text-secondary hover:bg-background/20"
                )}
              >
                {tech}
              </button>
            ))}
            {allTech.length === 0 && !loading && (
              <span className="text-[10px] text-secondary opacity-40 italic shrink-0">No tech data yet</span>
            )}
          </div>

          {/* Row 2: Category filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Tags className="w-4 h-4 text-secondary mr-1 shrink-0" />
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                !selectedCategory ? "bg-bh-red-500 text-primary" : "bg-surface/10 text-secondary hover:bg-background/20"
              )}
            >
              All Categories
            </button>
            {Object.keys(CATEGORY_COLORS).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap border",
                  selectedCategory === cat
                    ? CATEGORY_COLORS[cat]
                    : "bg-surface/10 border-glass text-secondary hover:bg-background/20"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading && allProjects.length === 0 ? (
        <div className="flex justify-center p-20">
          <RoseSpinner size="lg" />
        </div>
      ) : displayedProjects.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedProjects.map(project => {
              const likeCount = project.project_likes?.[0]?.count ?? 0;
              return (
                <div key={project.id} className="group relative lg-surface rounded-3xl border border-glass overflow-hidden transition-all hover:border-bh-red-500/50 hover:-translate-y-1 duration-300">
                  <div className="aspect-video relative overflow-hidden bg-surface/10">
                    {project.cover_image ? (
                      <Image 
                        src={cloudinaryUrl(project.cover_image, 600)} 
                        alt={project.title}
                        fill
                        loading="lazy"
                        className="object-cover transition-transform group-hover:scale-105 duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-bh-red-500/20 to-transparent">
                        <Code2 className="w-12 h-12 text-primary/20" />
                      </div>
                    )}
                    {project.github_verified && (
                      <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-bh-red-500 text-primary text-[10px] font-bold uppercase tracking-tighter flex items-center gap-1 shadow-lg">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {project.github_url && (
                        <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-background/50 backdrop-blur-md text-primary hover:bg-background/80 transition-colors">
                          <Github className="w-4 h-4" />
                        </a>
                      )}
                      {project.demo_url && (
                        <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-background/50 backdrop-blur-md text-primary hover:bg-background/80 transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    {/* Liked count badge on image */}
                    <div className="absolute bottom-3 right-3 px-2 py-1 rounded-full bg-background/60 backdrop-blur-md border border-glass text-primary text-[10px] font-medium flex items-center gap-1">
                      <Heart className="w-3 h-3 text-bh-red-500 fill-red-500" />
                      {likeCount}
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <Link href={`/projects/${project.id}`} className="text-xl font-bold text-primary group-hover:text-bh-red-500 transition-colors block truncate">
                          {project.title}
                        </Link>
                        <p className="text-xs font-mono text-accent-teal uppercase tracking-wider mt-1">
                          {project.event_id ? `Event: ${project.event_id}` : 'Independent Project'}
                        </p>
                        {project.category && (
                          <span className={cn(
                            "inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium border",
                            CATEGORY_COLORS[project.category] || CATEGORY_COLORS['Other']
                          )}>
                            {project.category}
                          </span>
                        )}
                      </div>
                      <LikeButton projectId={project.id} />
                    </div>
                    <p className="text-sm text-secondary line-clamp-2 leading-relaxed">
                      {project.description || 'No description provided.'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {project.tech_stack?.slice(0, 5).map(tech => (
                        <button
                          key={tech}
                          onClick={() => setSelectedTech(tech === selectedTech ? null : tech)}
                          className={cn(
                            "px-2 py-0.5 rounded-md border text-[10px] font-medium transition-all",
                            selectedTech === tech
                              ? "bg-bh-red-500/20 border-bh-red-500/50 text-bh-red-500"
                              : "bg-surface/10 border-glass text-secondary hover:bg-background/20"
                          )}
                        >
                          {tech}
                        </button>
                      ))}
                      {(project.tech_stack?.length ?? 0) > 5 && (
                        <span className="px-2 py-0.5 rounded-md bg-surface/10 border border-glass text-[10px] font-medium text-secondary">
                          +{(project.tech_stack?.length ?? 0) - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
                className="px-4 py-2 rounded-full bg-surface/10 border border-glass text-xs font-bold text-secondary hover:bg-surface/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={cn(
                      "w-8 h-8 rounded-full text-xs font-bold transition-all",
                      page === i
                        ? "bg-bh-red-500 text-primary"
                        : "bg-surface/10 border border-glass text-secondary hover:bg-surface/20"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                className="px-4 py-2 rounded-full bg-surface/10 border border-glass text-xs font-bold text-secondary hover:bg-surface/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="py-20 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-surface/10 flex items-center justify-center text-secondary">
            <Search className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xl font-bold text-primary">No projects found</p>
            <p className="text-secondary">Try adjusting your search or filters.</p>
          </div>
        </div>
      )}
    </div>
  );
}
