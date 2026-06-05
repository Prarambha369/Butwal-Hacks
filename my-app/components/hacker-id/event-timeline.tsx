"use client";

import React from 'react';
import { Calendar, Clock, CheckCircle2, Trophy, Mic, UserCheck, Award, Star, User } from 'lucide-react';
import { EventHistory } from '@/lib/hacker-id';

interface EventNodeProps {
  event: EventHistry;
}

function EventNode({ event }: EventNodeProps) {
  const isCompleted = event.status === 'Completed';

  const roleDesign = {
    Organizer: {
      color: 'bg-red-500 text-white border-red-600 shadow-[0_0_10px_rgba(230,57,70,0.5)]',
      icon: <Star size={12} fill="currentColor" />,
      label: 'Organizer',
      glow: 'group-hover:shadow-[0_0_15px_rgba(230,57,70,0.6)]'
    },
    Winner: {
      color: 'bg-yellow-400 text-black border-yellow-500 shadow-[0_0_10px_rgba(250,204,21,0.5)]',
      icon: <Trophy size={12} />,
      label: 'Champion',
      glow: 'group-hover:shadow-[0_0_15px_rgba(250,204,21,0.6)]'
    },
    'Runner-up': {
      color: 'bg-slate-300 text-slate-800 border-slate-400 shadow-[0_0_10px_rgba(148,163,184,0.5)]',
      icon: <Award size={12} />,
      label: 'Runner Up',
      glow: 'group-hover:shadow-[0_0_15px_rgba(148,163,184,0.6)]'
    },
    Speaker: {
      color: 'bg-purple-500 text-white border-purple-600 shadow-[0_0_10px_rgba(168,85,247,0.5)]',
      icon: <Mic size={12} />,
      label: 'Featured Speaker',
      glow: 'group-hover:shadow-[0_0_15px_rgba(168,85,247,0.6)]'
    },
    Judge: {
      color: 'bg-blue-500 text-white border-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.5)]',
      icon: <UserCheck size={12} />,
      label: 'Expert Judge',
      glow: 'group-hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]'
    },
    Mentor: {
      color: 'bg-teal-500 text-white border-teal-600 shadow-[0_0_10px_rgba(20,184,166,0.5)]',
      icon: <Star size={12} />,
      label: 'Mentor',
      glow: 'group-hover:shadow-[0_0_15px_rgba(20,184,166,0.6)]'
    },
    Volunteer: {
      color: 'bg-orange-500 text-white border-orange-600 shadow-[0_0_10px_rgba(234,98,42,0.5)]',
      icon: <User size={12} />,
      label: 'Community Volunteer',
      glow: 'group-hover:shadow-[0_0_15px_rgba(234,98,42,0.6)]'
    },
    Participant: {
      color: 'bg-white/10 text-text-secondary border-white/20',
      icon: <User size={12} />,
      label: 'Participant',
      glow: 'group-hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]'
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
      <div className="bh-glass-surface rounded-2xl p-5 border border-white/10 transition-all duration-300 group-hover:translate-x-1 group-hover:border-red-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-text-primary font-bold text-lg leading-tight">
                {event.name}
              </h4>
              {/* Status Pill */}
              <span className={`
                px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border
                ${event.status === 'Upcoming' 
                  ? 'bg-red-500/10 border-red-500/20 text-red-500 animate-pulse' 
                  : 'bg-white/5 border-white/10 text-text-secondary'}
              `}>
                {event.status}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-text-secondary">
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
            <div className="flex items-center gap-1 text-red-500 text-[10px] font-bold uppercase tracking-widest opacity-60">
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
      <div className="bh-glass-surface rounded-3xl p-12 border border-white/10 text-center space-y-4">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
          <Calendar size={32} className="text-text-secondary opacity-20" />
        </div>
        <p className="text-text-secondary font-mono text-sm opacity-60">
          No event history found. Start your journey.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2 mb-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-text-primary opacity-40">
          Event Timeline
        </h3>
        <span className="text-[10px] font-mono text-text-secondary opacity-60">
          {events.length} Milestones
        </span>
      </div>

      {/* Timeline Container */}
      <div className="relative">
        {/* The Vertical Line */}
        <div className="absolute left-0 top-2 bottom-2 w-[2px] bg-white/5" />
        
        <div className="space-y-0">
          {events.map((event) => (
            <EventNode key={event.id} event={event} />
          ))}
        </div>
      </div>
    </div>
  );
}
