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
  'Web App': 'bg-status-blue/20 text-status-blue border-status-blue/30',
  'Mobile App': 'bg-status-teal/20 text-status-teal border-status-teal/30',
  'AI/ML': 'bg-status-green/20 text-status-green border-status-green/30',
  'Data Science': 'bg-status-green/20 text-status-green border-status-green/30',
  'Blockchain': 'bg-status-orange/20 text-status-orange border-status-orange/30',
  'Hardware/IoT': 'bg-status-yellow/20 text-status-yellow border-status-yellow/30',
  'DevOps/Tools': 'bg-status-red/20 text-status-red border-status-red/30',
  'Game Dev': 'bg-status-blue/20 text-status-blue border-status-blue/30',
  'Open Source Tool': 'bg-status-teal/20 text-status-teal border-status-teal/30',
  'Other': 'bg-surface-hover text-muted-foreground border-border',
};

export default function ProjectGrid() {
  const [allProjects, setAllProjects] = useState<ProjectWithLikes[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'trending' | 'top'>('newest');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_hasMore, setHasMore] = useState(true);
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
  }, [searchQuery, selectedTech, selectedCategory, sortBy]);

  // Slice for client-side pagination
  const displayedProjects = allProjects.slice(0, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(allProjects.length / PAGE_SIZE);

  return (
    <div className="space-y-8">
      {/* Results count bar */}
      {!loading && allProjects.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <div className="w-1.5 h-1.5 rounded-full bg-bh-red-500" />
          {allProjects.length} project{allProjects.length !== 1 ? 's' : ''} found
          {(searchQuery || selectedTech || selectedCategory) && (
            <button
              onClick={() => { setSearchQuery(''); setSelectedTech(null); setSelectedCategory(null); }}
              className="ml-2 px-2 py-0.5 rounded-full bg-surface-hover hover:bg-surface/20 text-muted-foreground hover:text-primary transition-colors text-[10px]"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Filters Section */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-surface-hover p-4 rounded-lg border border-border">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border focus:border-bh-red-500 outline-none transition-all text-sm"
            placeholder="Search projects by title..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col gap-4 w-full">
          {/* Row 1: Sort + Tech filters */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="flex items-center gap-2 mr-4 border-r border-border pr-4 shrink-0">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest shrink-0">Sort:</span>
              <select 
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'newest' | 'trending' | 'top')}
                className="bg-transparent text-xs font-bold outline-none cursor-pointer hover:text-primary-red transition-colors"
              >
                <option value="newest" className="bg-background">Newest</option>
                <option value="trending" className="bg-background">Trending</option>
                <option value="top" className="bg-background">Top Rated</option>
              </select>
            </div>
            <Filter className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
            <button 
              onClick={() => setSelectedTech(null)}
              className={cn(
                "inline-flex items-center px-3 min-h-[44px] rounded-full text-xs font-medium transition-all whitespace-nowrap",
                !selectedTech ? "bg-bh-red-500 text-primary" : "bg-surface-hover text-muted-foreground hover:bg-background/20"
              )}
            >
              All
            </button>
            {allTech.map(tech => (
              <button 
                key={tech}
                onClick={() => setSelectedTech(tech)}
                className={cn(
                  "inline-flex items-center px-3 min-h-[44px] rounded-full text-xs font-medium transition-all whitespace-nowrap",
                  selectedTech === tech ? "bg-bh-red-500 text-primary" : "bg-surface-hover text-muted-foreground hover:bg-background/20"
                )}
              >
                {tech}
              </button>
            ))}
            {allTech.length === 0 && !loading && (
              <span className="text-[10px] text-muted-foreground opacity-40 italic shrink-0">No tech data yet</span>
            )}
          </div>

          {/* Row 2: Category filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Tags className="w-4 h-4 text-muted-foreground mr-1 shrink-0" />
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "inline-flex items-center px-3 min-h-[44px] rounded-full text-xs font-medium transition-all whitespace-nowrap",
                !selectedCategory ? "bg-bh-red-500 text-primary" : "bg-surface-hover text-muted-foreground hover:bg-background/20"
              )}
            >
              All Categories
            </button>
            {Object.keys(CATEGORY_COLORS).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                className={cn(
                  "inline-flex items-center px-3 min-h-[44px] rounded-full text-xs font-medium transition-all whitespace-nowrap border",
                  selectedCategory === cat
                    ? CATEGORY_COLORS[cat]
                    : "bg-surface-hover border-border text-muted-foreground hover:bg-background/20"
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
                <div key={project.id} className="group relative bh-card overflow-hidden transition-all hover:border-primary-red/50 hover:-translate-y-1 duration-300">
                  <div className="aspect-video relative overflow-hidden bg-surface-hover">
                    {project.cover_image ? (
                      <Image 
                        src={cloudinaryUrl(project.cover_image, 600)} 
                        alt={project.title}
                        fill
                        loading="lazy"
                        className="object-cover transition-transform group-hover:scale-105 duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-red/20 to-transparent">
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
                        <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="min-w-[44px] min-h-[44px] p-2 rounded-full bg-background/50 text-primary hover:bg-background/80 transition-colors flex items-center justify-center">
                          <Github className="w-4 h-4" />
                        </a>
                      )}
                      {project.demo_url && (
                        <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="min-w-[44px] min-h-[44px] p-2 rounded-full bg-background/50 text-primary hover:bg-background/80 transition-colors flex items-center justify-center">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    {/* Liked count badge on image */}
                    <div className="absolute bottom-3 right-3 px-2 py-1 rounded-full bg-background/60 border border-border text-primary text-[10px] font-medium flex items-center gap-1">
                      <Heart className="w-3 h-3 text-primary-red fill-red-500" />
                      {likeCount}
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <Link href={`/projects/${project.id}`} className="text-xl font-bold text-primary group-hover:text-primary-red transition-colors block truncate">
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
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {project.description || 'No description provided.'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {project.tech_stack?.slice(0, 5).map(tech => (
                        <button
                          key={tech}
                          onClick={() => setSelectedTech(tech === selectedTech ? null : tech)}
                          className={cn(
                            "inline-flex items-center px-2 min-h-[44px] rounded-md border text-[10px] font-medium transition-all",
                            selectedTech === tech
                              ? "bg-primary-red/20 border-primary-red/50 text-primary-red"
                              : "bg-surface-hover border-border text-muted-foreground hover:bg-background/20"
                          )}
                        >
                          {tech}
                        </button>
                      ))}
                      {(project.tech_stack?.length ?? 0) > 5 && (
                        <span className="px-2 py-0.5 rounded-md bg-surface-hover border border-border text-[10px] font-medium text-muted-foreground">
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
                className="px-4 py-2 rounded-full bg-surface-hover border border-border text-xs font-bold text-muted-foreground hover:bg-surface-hover transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
                        : "bg-surface-hover border border-border text-muted-foreground hover:bg-surface/20"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                className="px-4 py-2 rounded-full bg-surface-hover border border-border text-xs font-bold text-muted-foreground hover:bg-surface-hover transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="py-20 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center text-muted-foreground">
            <Search className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xl font-bold text-primary">No projects found</p>
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        </div>
      )}
    </div>
  );
}
