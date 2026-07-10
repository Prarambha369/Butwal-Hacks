"use client";

import React from 'react';
import { Calendar, CheckCircle2, Trophy, Mic, UserCheck, Award, Star, User } from 'lucide-react';
import { EventHistory } from '@/lib/supabase-types';

interface EventNodeProps {
  event: EventHistory;
}

function EventNode({ event }: EventNodeProps) {
  const isCompleted = event.status === 'Completed';

  const roleDesign = {
    Organizer: {
      color: 'bg-bh-red-500 text-primary border-bh-red-600 shadow-[0_0_10px_var(--glow-bh-red)]',
      icon: <Star size={12} fill="currentColor" />,
      label: 'Organizer',
      glow: 'group-hover:shadow-[0_0_15px_var(--glow-bh-red)]'
    },
    Winner: {
      color: 'bg-status-yellow text-primary border-status-yellow shadow-[0_0_10px_var(--glow-status-yellow)]',
      icon: <Trophy size={12} />,
      label: 'Champion',
      glow: 'group-hover:shadow-[0_0_15px_var(--glow-status-yellow)]'
    },
    'Runner-up': {
      color: 'bg-surface text-primary border-glass shadow-[0_0_10px_var(--glow-white-subtle)]',
      icon: <Award size={12} />,
      label: 'Runner Up',
      glow: 'group-hover:shadow-[0_0_15px_var(--glow-white-subtle)]'
    },
    Speaker: {
      color: 'bg-status-purple text-primary border-status-purple shadow-[0_0_10px_var(--glow-status-purple)]',
      icon: <Mic size={12} />,
      label: 'Featured Speaker',
      glow: 'group-hover:shadow-[0_0_15px_var(--glow-status-purple)]'
    },
    Judge: {
      color: 'bg-status-blue text-primary border-status-blue shadow-[0_0_10px_var(--glow-status-blue)]',
      icon: <UserCheck size={12} />,
      label: 'Expert Judge',
      glow: 'group-hover:shadow-[0_0_15px_var(--glow-status-blue)]'
    },
    Mentor: {
      color: 'bg-status-teal text-primary border-status-teal shadow-[0_0_10px_var(--glow-status-teal)]',
      icon: <Star size={12} />,
      label: 'Mentor',
      glow: 'group-hover:shadow-[0_0_15px_var(--glow-status-teal)]'
    },
    Volunteer: {
      color: 'bg-status-orange text-primary border-status-orange shadow-[0_0_10px_var(--glow-status-orange)]',
      icon: <User size={12} />,
      label: 'Community Volunteer',
      glow: 'group-hover:shadow-[0_0_15px_var(--glow-status-orange)]'
    },
    Participant: {
      color: 'bg-surface/10 text-secondary border-glass',
      icon: <User size={12} />,
      label: 'Participant',
      glow: 'group-hover:shadow-[0_0_10px_var(--glow-white-subtle)]'
    },
  };

  const design = roleDesign[event.role] || roleDesign.Participant;

  return (
    <div className="relative pl-8 pb-12 group">
      {/* The Node Dot */}
      <div 
        className={`
          absolute left-[-6px] top-1 w-3 h-3 rounded-full z-10 transition-all duration-300 
          ${design.color.split(' ')[0]} ${design.glow}
          ${!isCompleted ? 'opacity-50' : 'opacity-100'}
        `}
      />

      {/* Content Card */}
      <div className="lg-surface rounded-2xl p-5 border border-glass transition-all duration-300 group-hover:translate-x-1 group-hover:border-bh-red-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-primary font-bold text-lg leading-tight">
                {event.name}
              </h4>
              {/* Status Pill */}
              <span className={`
                px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border
                ${event.status === 'Upcoming' 
                  ? 'bg-bh-red-500/10 border-bh-red-500/20 text-bh-red-500 animate-pulse' 
                  : 'bg-surface/10 border-glass text-secondary'}
              `}>
                {event.status}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-secondary">
              <span className="flex items-center gap-1 font-mono opacity-60 text-[11px]">
                <Calendar size={12} />
                {event.date}
              </span>
              {/* Dynamic Role Badge */}
              <div className={`
                flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-widest
                ${design.color} ${design.glow}
              `}>
                {design.icon}
                {design.label}
              </div>
            </div>
          </div>

          {isCompleted && (
            <div className="flex items-center gap-1 text-bh-red-500 text-[10px] font-bold uppercase tracking-widest opacity-60">
              <CheckCircle2 size={12} />
              Attended
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EventTimeline({ events }: { events: EventHistory[] }) {
  if (events.length === 0) {
    return (
      <div className="lg-surface rounded-3xl p-12 border border-glass text-center space-y-4">
        <div className="w-16 h-16 bg-surface/10 rounded-full flex items-center justify-center mx-auto">
          <Calendar size={32} className="text-secondary opacity-20" />
        </div>
        <p className="text-secondary font-mono text-sm opacity-60">
          No event history found. Start your journey.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2 mb-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-primary opacity-40">
          Event Timeline
        </h3>
        <span className="text-[10px] font-mono text-secondary opacity-60">
          {events.length} Milestones
        </span>
      </div>

      {/* Timeline Container */}
      <div className="relative">
        {/* The Vertical Line */}
        <div className="absolute left-0 top-2 bottom-2 w-[2px] bg-surface/10" />
        
        <div className="space-y-0">
          {events.map((event) => (
            <EventNode key={event.id} event={event} />
          ))}
        </div>
      </div>
    </div>
  );
}
