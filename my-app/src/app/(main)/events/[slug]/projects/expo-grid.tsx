"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Filter, Code2, Github, ExternalLink, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExpoProject {
  id: string;
  title: string;
  description: string | null;
  tech_stack: string[];
  cover_image: string | null;
  github_url: string | null;
  demo_url: string | null;
  created_at: string;
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    bh_id: string | null;
  } | null;
}

export default function ExpoProjectGrid({
  projects,
}: {
  projects: ExpoProject[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTech, setSelectedTech] = useState<string | null>(null);

  // Extract unique tech stacks across all projects
  const allTech = useMemo(() => {
    const techSet = new Set<string>();
    projects.forEach((p) => p.tech_stack?.forEach((t) => techSet.add(t)));
    return Array.from(techSet).sort();
  }, [projects]);

  // Filtered projects
  const filtered = useMemo(() => {
    let results = projects;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q),
      );
    }
    if (selectedTech) {
      results = results.filter((p) => p.tech_stack?.includes(selectedTech));
    }
    return results;
  }, [projects, searchQuery, selectedTech]);

  return (
    <div className="space-y-8">
      {/* Results count */}
      {projects.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <div className="w-1.5 h-1.5 rounded-full bg-bh-red-500" />
          {filtered.length === projects.length
            ? `${projects.length} project${projects.length === 1 ? "" : "s"}`
            : `${filtered.length} of ${projects.length} project${projects.length === 1 ? "" : "s"}`}
          {(searchQuery || selectedTech) && (
            <button
              onClick={() => { setSearchQuery(""); setSelectedTech(null); }}
              className="ml-2 px-2 py-0.5 rounded-full bg-surface-hover hover:bg-surface-hover text-muted-foreground hover:text-primary transition-colors text-[10px]"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      {projects.length > 0 && (
        <div className="flex flex-col md:flex-row gap-4 bg-surface-hover p-4 rounded-lg border border-border">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border focus:border-bh-red-500 outline-none transition-all text-sm"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <button
              onClick={() => setSelectedTech(null)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                !selectedTech
                  ? "bg-bh-red-500 text-white"
                  : "bg-surface-hover text-muted-foreground hover:bg-surface-hover",
              )}
            >
              All
            </button>
            {allTech.map((tech) => (
              <button
                key={tech}
                onClick={() => setSelectedTech(tech === selectedTech ? null : tech)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                  selectedTech === tech
                    ? "bg-bh-red-500 text-white"
                    : "bg-surface-hover text-muted-foreground hover:bg-surface-hover",
                )}
              >
                {tech}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="bh-card p-16 text-center space-y-4">
          <Search size={48} className="mx-auto opacity-20" />
          <p className="text-xl font-bold text-primary">No projects match</p>
          <p className="text-muted-foreground max-w-md mx-auto">
            Try adjusting your search or filter to find what you&apos;re looking for.
          </p>
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: ExpoProject }) {
  const p = project.profiles;
  const techStack: string[] = project.tech_stack || [];

  return (
    <article className="group bh-card overflow-hidden transition-all hover:border-primary-red/30 hover:-translate-y-1">
      {/* Cover image */}
      <Link href={`/projects/${project.id}`} className="block relative h-48 overflow-hidden bg-surface-hover">
        {project.cover_image ? (
          <Image
            src={project.cover_image}
            alt={project.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <Code2 className="w-12 h-12 text-primary/10" />
          </div>
        )}
      </Link>

      <div className="p-6 space-y-4">
        {/* Title + description */}
        <Link href={`/projects/${project.id}`} className="block space-y-2">
          <h2 className="text-xl font-bold text-primary group-hover:text-primary-red transition-colors">
            {project.title}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {project.description}
          </p>
        </Link>

        {/* Tech stack */}
        {techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {techStack.slice(0, 4).map((tech: string) => (
              <span
                key={tech}
                className="px-2 py-0.5 rounded-md bg-surface-hover border border-border text-[10px] font-mono text-muted-foreground"
              >
                {tech}
              </span>
            ))}
            {techStack.length > 4 && (
              <span className="text-[10px] text-muted-foreground font-mono">+{techStack.length - 4}</span>
            )}
          </div>
        )}

        {/* Creator + links */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="relative w-7 h-7 rounded-full overflow-hidden bg-surface-hover">
              {p?.avatar_url ? (
                <Image src={p.avatar_url} alt={p.full_name || ""} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                  {(p?.full_name || "?")[0]}
                </div>
              )}
            </div>
            <span className="text-xs font-medium text-muted-foreground">{p?.full_name || "Unknown"}</span>
          </div>

          <div className="flex gap-2">
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-primary transition-all"
              >
                <Github className="w-4 h-4" />
              </a>
            )}
            {project.demo_url && (
              <a
                href={project.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-primary transition-all"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <Link
              href={`/projects/${project.id}`}
              className="p-1.5 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-primary transition-all"
            >
              <Users className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
