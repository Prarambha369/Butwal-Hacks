"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Users, Trophy, ExternalLink, Code2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { Team, Profile, Project } from '@/lib/supabase-types';

import { cloudinaryUrl } from '@/lib/utils';
import { RoseSpinner } from '@/components/ui/rose-loader';
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  if (loading) return <div className="flex justify-center p-20"><RoseSpinner size="lg" /></div>;
  if (!team) return <div className="text-center py-20">Team not found</div>;

  return (
    <div className="space-y-12">
      {/* Team Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-8 rounded-3xl bg-surface/10 border border-glass">
        <div className="space-y-4 text-center md:text-left">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="p-3 rounded-2xl bg-bh-red-500/10 text-bh-red-500">
              <Users className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight font-heading">
              {team.name}
            </h1>
          </div>
          <p className="text-secondary font-mono text-sm">Team ID: {team.id}</p>
        </div>
        
        <div className="flex gap-4">
          <div className="text-center px-6 py-3 rounded-2xl bg-surface/10 border border-glass">
            <p className="text-2xl font-bold">{members.length}</p>
            <p className="text-[10px] font-mono text-secondary uppercase tracking-widest">Members</p>
          </div>
          <div className="text-center px-6 py-3 rounded-2xl bg-surface/10 border border-glass">
            <p className="text-2xl font-bold">{projects.length}</p>
            <p className="text-[10px] font-mono text-secondary uppercase tracking-widest">Projects</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Team Members */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-bh-red-500" /> The Squad
          </h3>
          <div className="space-y-4">
            {members.map(member => (
              <Link 
                key={member?.id} 
                href={`/profile/${member?.bh_id}`}
                className="flex items-center gap-4 p-4 rounded-2xl bg-surface/10 border border-glass hover:bg-surface/10 transition-all group"
              >
                <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/10 group-hover:ring-bh-red-500/50 transition-all">
                  <Image 
                    src={member?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member?.full_name}`} 
                    alt={member?.full_name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-bold text-sm group-hover:text-bh-red-500 transition-colors">{member?.full_name}</p>
                  <p className="text-[10px] font-mono text-secondary">{member?.bh_id}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Team Projects */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-bh-red-500" /> Project Portfolio
          </h3>
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map(project => (
                <div key={project.id} className="lg-surface p-6 rounded-3xl border border-glass space-y-4 hover:border-bh-red-500/50 transition-all">
                  <div className="aspect-video rounded-2xl overflow-hidden bg-surface/10 border border-glass">
                    {project.cover_image ? (
                      <Image loading="lazy" src={cloudinaryUrl(project.cover_image, 600)} alt={project.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary/10">
                        <Code2 className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold group-hover:text-bh-red-500 transition-colors">{project.title}</h4>
                    <p className="text-sm text-secondary line-clamp-2 mt-2">{project.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4">
                    <div className="flex flex-wrap gap-2">
                      {project.tech_stack?.slice(0, 2).map(tech => (
                        <span key={tech} className="px-2 py-0.5 rounded-md bg-surface/10 border border-glass text-[10px] font-medium text-secondary">
                          {tech}
                        </span>
                      ))}
                    </div>
                    <Link 
                      href={`/projects/${project.id}`}
                      className="p-2 rounded-xl bg-bh-red-500 text-primary hover:bg-bh-red-500/90 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-surface/10 rounded-3xl border border-glass">
              <Code2 className="w-12 h-12 text-primary/10 mx-auto mb-4" />
              <p className="text-secondary">This team hasn&apos;t submitted any projects yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
