"use client";

import { Calendar, CheckCircle2, Trophy, Mic, UserCheck, Award, Star, User } from 'lucide-react';
import { EventHistory } from '@/lib/supabase-types';

interface EventNodeProps {
  event: EventHistory;
}

function EventNode({ event }: EventNodeProps) {
  const isCompleted = event.status === 'Completed';

  const roleDesign = {
    Organizer: {
      color: 'bg-primary-red text-white border-deep-red shadow-[0_0_10px_rgba(254,0,0,0.2)]',
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
      color: 'bg-surface text-primary border-border shadow-[0_0_10px_var(--glow-white-subtle)]',
      icon: <Award size={12} />,
      label: 'Runner Up',
      glow: 'group-hover:shadow-[0_0_15px_var(--glow-white-subtle)]'
    },
    Speaker: {
      color: 'bg-status-orange text-primary border-status-orange shadow-[0_0_10px_var(--glow-status-orange)]',
      icon: <Mic size={12} />,
      label: 'Featured Speaker',
      glow: 'group-hover:shadow-[0_0_15px_var(--glow-status-orange)]'
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
      color: 'bg-surface-hover text-muted-foreground border-border',
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
      <div className="bh-card p-5 transition-all duration-300 group-hover:translate-x-1 group-hover:border-primary-red/20">
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
                  ? 'bg-primary-red/10 border-primary-red/20 text-primary-red animate-pulse' 
                  : 'bg-surface-hover border-border text-muted-foreground'}
              `}>
                {event.status}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
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
            <div className="flex items-center gap-1 text-primary-red text-[10px] font-bold uppercase tracking-widest opacity-60">
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
      <div className="bh-card p-12 text-center space-y-4">
        <div className="w-16 h-16 bg-surface-hover rounded-full flex items-center justify-center mx-auto">
          <Calendar size={32} className="text-muted-foreground opacity-20" />
        </div>
        <p className="text-muted-foreground font-mono text-sm opacity-60">
          No events yet. Join one to get started.
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
        <span className="text-[10px] font-mono text-muted-foreground opacity-60">
          {events.length} Milestones
        </span>
      </div>

      {/* Timeline Container */}
      <div className="relative">
        {/* The Vertical Line */}
        <div className="absolute left-0 top-2 bottom-2 w-[2px] bg-surface-hover" />
        
        <div className="space-y-0">
          {events.map((event) => (
            <EventNode key={event.id} event={event} />
          ))}
        </div>
      </div>
    </div>
  );
}
