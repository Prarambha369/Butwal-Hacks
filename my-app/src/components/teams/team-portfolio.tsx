"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Users, Trophy, ExternalLink, Code2 } from 'lucide-react';
import { createClient } from '@/utils/supabase';
import { Team, Profile, Project } from '@/lib/supabase-types';

import { cloudinaryUrl, getAvatarUrl } from '@/lib/utils';
import { Skeleton, CardSkeleton, FeedSkeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { logger } from '@/lib/logger';

interface TeamPortfolioProps {
  teamId: string;
}

export default function TeamPortfolio({ teamId }: TeamPortfolioProps) {
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch team
      const { data: teamData } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      // Fetch members
      const { data: membersData } = await supabase
        .from('team_members')
        .select('profiles(*)')
        .eq('team_id', teamId);

      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      setTeam(teamData || null);
      setMembers((membersData?.map(m => m.profiles) as unknown as Profile[]) || []);
      setProjects(projectsData || []);
    } catch (error) {
      logger.error('Error fetching team portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [teamId]);

  if (loading) return (
    <div className="space-y-12">
      <div className="bh-card p-8 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 w-full">
          <div className="flex items-center gap-3">
            <Skeleton className="h-14 w-14 rounded-xl" />
            <Skeleton className="h-10 w-48" />
          </div>
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="space-y-4">
          <Skeleton className="h-6 w-28" />
          <FeedSkeleton count={3} />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-6 w-36" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <CardSkeleton key={i} lines={1} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
  if (!team) return <div className="text-center py-20">Team not found</div>;

  return (
    <div className="space-y-12">
      {/* Team Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-8 rounded-xl bg-surface-hover border border-border">
        <div className="space-y-4 text-center md:text-left">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="p-3 rounded-lg bg-primary-red/10 text-primary-red">
              <Users className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight font-heading">
              {team.name}
            </h1>
          </div>
          <p className="text-secondary font-mono text-sm">Team ID: {team.id}</p>
        </div>
        
        <div className="flex gap-4">
          <div className="text-center px-6 py-3 rounded-lg bg-surface-hover border border-border">
            <p className="text-2xl font-bold">{members.length}</p>
            <p className="text-[10px] font-mono text-secondary uppercase tracking-widest">Members</p>
          </div>
          <div className="text-center px-6 py-3 rounded-lg bg-surface-hover border border-border">
            <p className="text-2xl font-bold">{projects.length}</p>
            <p className="text-[10px] font-mono text-secondary uppercase tracking-widest">Projects</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Team Members */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-red" /> The Squad
          </h3>
          <div className="space-y-4">
            {members.map(member => (
              <Link 
                key={member?.id} 
                href={`/profile/${member?.bh_id}`}
                className="flex items-center gap-4 p-4 rounded-lg bg-surface-hover border border-border hover:bg-surface-hover transition-all group"
              >
                <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/10 group-hover:ring-bh-red-500/50 transition-all">
                  <Image 
                    src={getAvatarUrl(member?.avatar_url, member?.full_name)}
                    alt={member?.full_name ?? 'Team member'}
                    fill
                    className="object-cover"
                    unoptimized={!member?.avatar_url}
                  />
                </div>
                <div>
                  <p className="font-bold text-sm group-hover:text-primary-red transition-colors">{member?.full_name}</p>
                  <p className="text-[10px] font-mono text-secondary">{member?.bh_id}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Team Projects */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary-red" /> Project Portfolio
          </h3>
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map(project => (
                <div key={project.id} className="bh-card p-6 space-y-4 hover:border-primary-red/50 transition-all">
                  <div className="aspect-video rounded-lg overflow-hidden bg-surface-hover border border-border">
                    {project.cover_image ? (
                      <Image loading="lazy" src={cloudinaryUrl(project.cover_image, 600)} alt={project.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary/10">
                        <Code2 className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold group-hover:text-primary-red transition-colors">{project.title}</h4>
                    <p className="text-sm text-secondary line-clamp-2 mt-2">{project.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4">
                    <div className="flex flex-wrap gap-2">
                      {project.tech_stack?.slice(0, 2).map(tech => (
                        <span key={tech} className="px-2 py-0.5 rounded-md bg-surface-hover border border-border text-[10px] font-medium text-secondary">
                          {tech}
                        </span>
                      ))}
                    </div>
                    <Link 
                      href={`/projects/${project.id}`}
                      className="p-2 rounded-lg bg-bh-red-500 text-primary hover:bg-primary-red/90 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-surface-hover rounded-xl border border-border">
              <Code2 className="w-12 h-12 text-primary/10 mx-auto mb-4" />
              <p className="text-secondary">This team hasn&apos;t submitted any projects yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
