"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Calendar, MapPin, Trophy, Clock, ArrowRight, ExternalLink, Code, Users, Mail, FileText, ShieldCheck, Globe, Zap, Download } from 'lucide-react';
import type { Program } from '@/lib/content';


export default function ProgramDetailClient({ program }: { program: Program }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'logistics' | 'rewards' | 'gallery' | 'resources'>('overview');

  const eventData = {
    slug: program.slug,
    title: program.title,
    tagline: program.tagline,
    dateLabel: program.dateLabel,
    date: program.dateLabel,
    initiativeSlug: program.initiativeSlug,
    status: program.status,
    location: program.location,
    type: program.type,
    price: program.price,
    duration: "48 Hours",
    banner: "https://images.unsplash.com/photo-1504384308090-c894fdbe539b?auto=format&fit=crop&q=80&w=1600",
    logo: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=200",
    hostedBy: "Butwal Hacks Foundation",
    managerEmail: "manager@butwalhacks.com",
    requirements: ["A valid ID", "A passion for building", "Laptop & Charger"],
    whoCanParticipate: program.whoCanParticipate,
    submissions: 127,
  };

  const projects = [
    {
      name: "Lumbini Agri-Tech",
      desc: "AI-powered soil analysis tool for local farmers.",
      tech: ["React", "TensorFlow", "Node.js"],
      image: "https://images.unsplash.com/photo-1586771107445-d37d66bc7c99?auto=format&fit=crop&q=80&w=400",
      link: "https://devpost.com"
    },
    {
      name: "Butwal Transit",
      desc: "Real-time tracking for regional transport systems.",
      tech: ["Flutter", "Firebase", "Google Maps"],
      image: "https://images.unsplash.com/photo-1557821552-17542dagger-crop&q=80&w=400",
      link: "https://devpost.com"
    },
    {
      name: "EduConnect Nepal",
      desc: "Decentralized resource sharing for rural schools.",
      tech: ["Next.js", "Solidity", "IPFS"],
      image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=400",
      link: "https://devpost.com"
    }
  ];

  const tabs = {
    overview: {
      label: "Overview",
      content: (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-primary leading-[1.2]">The Mission</h3>
              <p className="text-secondary leading-relaxed">
                The {program.title} is Butwal&apos;s premier building event. We bring together the brightest minds 
                in the Lumbini Province to build tools that solve real-world problems—from AI-powered agriculture to accessible education platforms.
                We focus on &quot;Localized Innovation&quot;—building tools that actually impact the streets of Butwal.
              </p>
              <div className="p-6 bh-card rounded-xl border-l-4 border-primary-red transition-all hover:bg-surface-hover">
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-primary-red" /> Core Requirements
                </h4>
                <ul className="text-sm text-secondary space-y-2">
                  {eventData.requirements.map((req, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-bh-red-500 rounded-full" /> {req}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-primary leading-[1.2]">Who Can Participate?</h3>
              <ul className="space-y-2">
                {eventData.whoCanParticipate.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-secondary leading-relaxed">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-bh-red-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="p-6 bh-card rounded-xl space-y-4 transition-all hover:bg-surface-hover">
                <h4 className="font-bold flex items-center gap-2">
                  <Globe size={18} className="text-blue-500" /> Participation Type
                </h4>
                <p className="text-sm text-secondary">
                  This is a <span className="text-primary font-bold">{program.type}</span> event. 
                  Physical attendees will be provided with meals and workspace, while online 
                  participants will have access to all mentorship channels.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-primary leading-[1.2]">The Rules</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: "Originality", text: "All code must be written during the event." },
                { title: "Team Size", text: "1-4 members per team." },
                { title: "Conduct", text: "Zero tolerance for harassment or plagiarism." },
              ].map((rule, i) => (
                <div key={i} className="p-6 bh-card rounded-xl space-y-2 transition-all hover:bg-surface-hover hover:-translate-y-1">
                  <div className="font-bold text-sm">{rule.title}</div>
                  <div className="text-xs text-secondary">{rule.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    logistics: {
      label: "Logistics",
      content: (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-primary leading-[1.2]">Judging Criteria</h3>
              <div className="space-y-4">
                {[
                  { criteria: "Innovation", weight: "30%", desc: "How unique is the solution?" },
                  { criteria: "Technical Execution", weight: "40%", desc: "Quality of code and functionality." },
                  { criteria: "Local Impact", weight: "30%", desc: "Does it solve a real Butwal problem?" },
                ].map((item, i) => (
                  <div key={i} className="p-4 bh-card rounded-lg flex justify-between items-center transition-all hover:bg-surface-hover">
                    <div>
                      <div className="font-bold text-sm">{item.criteria}</div>
                      <div className="text-xs text-secondary">{item.desc}</div>
                    </div>
                    <div className="font-mono text-primary-red font-bold">{item.weight}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-primary leading-[1.2]">The Judges</h3>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="p-4 bh-card flex items-center gap-3 transition-all hover:bg-surface-hover">
                    <div className="w-10 h-10 rounded-full bg-surface border border-border" />
                    <div>
                      <div className="text-xs font-bold">{`Judge ${j}`}</div>
                      <div className="text-[10px] text-secondary">Industry Expert</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-primary leading-[1.2]">Schedule</h3>
            <div className="space-y-4">
              {[
                { time: "Friday 6:00 PM", event: "Opening Ceremony", desc: "Welcome, team formation, and prompt reveal." },
                { time: "Saturday 10:00 AM", event: "Mentor Check-ins", desc: "One-on-one guidance for all teams." },
                { time: "Sunday 12:00 PM", event: "Project Submission", desc: "Final commits and demo recordings due." },
                { time: "Sunday 3:00 PM", event: "Grand Finale", desc: "Pitches, judging, and awards ceremony." },
              ].map((item, i) => (
                <div key={i} className="flex gap-6 p-6 bh-card rounded-xl items-center transition-all hover:bg-surface-hover">
                  <div className="font-mono text-primary-red font-bold whitespace-nowrap">{item.time}</div>
                  <div>
                    <div className="font-bold text-primary">{item.event}</div>
                    <div className="text-sm text-secondary">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    rewards: {
      label: "Rewards",
      content: (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { rank: "1st Place", project: "The Champion", prize: "$1,000 + Incubation", icon: "🏆" },
              { rank: "2nd Place", project: "The Runner-up", prize: "$500 + Gear", icon: "🥈" },
              { rank: "3rd Place", project: "The Innovator", prize: "$250 + Gear", icon: "🥉" },
            ].map((p, i) => (
              <div key={i} className="p-8 bh-card rounded-xl text-center space-y-4 border-t-2 border-primary-red transition-all hover:bg-surface-hover">
                <div className="text-4xl">{p.icon}</div>
                <div className="font-bold text-xl">{p.rank}</div>
                <div className="text-primary font-semibold">{p.project}</div>
                <div className="text-secondary text-sm">{p.prize}</div>
              </div>
            ))}
          </div>
          
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-primary leading-[1.2]">Our Sponsors</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {[1, 2, 3, 4, 5].map(s => (
                <div key={s} className="aspect-square bh-card rounded-xl flex items-center justify-center p-6 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer hover:bg-surface-hover">
                  <span className="text-xs font-bold text-center">{`Sponsor ${s}`}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    gallery: {
      label: "Gallery",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {projects.map((project, i) => (
            <div key={i} className="bh-card rounded-xl p-4 group flex flex-col h-full">
              <div className="lg-concentric-inner rounded-lg aspect-video mb-4 relative overflow-hidden">
                <Image src={project.image} alt={project.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <h4 className="font-bold text-primary mb-2">{project.name}</h4>
              <p className="text-xs text-secondary mb-4 flex-1">{project.desc}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tech.map(t => <span key={t} className="inline-flex items-center rounded-full border border-border bg-surface-hover px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-text-secondary">{t}</span>)}
              </div>
              <a href={project.link} target="_blank" className="flex items-center justify-center gap-2 py-2 rounded-full border border-border text-xs hover:bg-surface-hover transition-all">
                View on Devpost <ExternalLink size={12} />
              </a>
            </div>
          ))}
        </div>
      )
    },
    resources: {
      label: "Resources",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-primary leading-[1.2]">Builder&apos;s Toolbox</h3>
            <div className="space-y-4">
              {[
                { name: "GitHub Starter Kit", desc: "Standard repo templates for hackathons.", icon: <Code size={18} /> },
                { name: "UI Kit", desc: "Pre-made Liquid Glass components.", icon: <Zap size={18} /> },
                { name: "API Documentation", desc: "Local government data endpoints.", icon: <FileText size={18} /> },
              ].map((res, i) => (
                <div key={i} className="p-4 bh-card flex items-center justify-between group cursor-pointer hover:bg-surface-hover transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-surface-hover rounded-lg text-primary-red">{res.icon}</div>
                    <div>
                      <div className="text-sm font-bold">{res.name}</div>
                      <div className="text-xs text-secondary">{res.desc}</div>
                    </div>
                  </div>
                  <Download size={16} className="text-secondary group-hover:text-primary transition-colors" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-primary leading-[1.2]">Support</h3>
            <div className="p-8 bh-card rounded-xl text-center space-y-6 transition-all hover:bg-surface-hover">
              <div className="w-16 h-16 bg-primary-red/20 rounded-full flex items-center justify-center mx-auto text-primary-red">
                <Mail size={32} />
              </div>
              <div>
                <h4 className="font-bold text-lg">Have Questions?</h4>
                <p className="text-sm text-secondary mb-6">Our hackathon manager is here to help you with any queries.</p>
                <a 
                  href={`mailto:${eventData.managerEmail}`}
                  className="bh-btn-primary w-full justify-center"
                >
                  Email Manager
                </a>
              </div>
            </div>
          </div>
        </div>
      )
    }
  };

  return (
    <div className="min-h-dvh pt-32 pb-24 px-6 md:px-20">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Event Hero Section */}
        <div className="relative rounded-xl overflow-hidden bh-card p-4 md:p-8 flex flex-col lg:flex-row gap-8 items-center">
          <div className="w-full lg:w-1/2 aspect-video rounded-xl overflow-hidden lg-concentric-inner shadow-2xl relative group">
            <Image src={eventData.banner} alt={eventData.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute top-4 left-4">
              <Image src={eventData.logo} alt="Logo" width={64} height={64} className="rounded-lg border-2 border-border shadow-lg" />
            </div>
          </div>
          
          <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-left">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-status-green/30 bg-status-green/8 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-status-green"><span className="h-1.5 w-1.5 rounded-full bg-status-green shadow-[0_0_6px_rgba(34,197,94,0.4)]" />Official Event</span>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-primary leading-tight">{program.title}</h1>
              <p className="text-xl text-secondary">{program.tagline}</p>
            </div>
            
            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-6 border-y border-border">
              <div className="flex flex-col items-center lg:items-start gap-1">
                <div className="flex items-center gap-2 text-secondary text-xs font-mono uppercase">
                  <Calendar size={14} /> Date
                </div>
                <div className="font-bold text-sm">{program.dateLabel}</div>
              </div>
              <div className="flex flex-col items-center lg:items-start gap-1">
                <div className="flex items-center gap-2 text-secondary text-xs font-mono uppercase">
                  <MapPin size={14} /> Location
                </div>
                <div className="font-bold text-sm">{program.location}</div>
              </div>
              <div className="flex flex-col items-center lg:items-start gap-1">
                <div className="flex items-center gap-2 text-secondary text-xs font-mono uppercase">
                  <Globe size={14} /> Type
                </div>
                <div className="font-bold text-sm">{program.type}</div>
              </div>
              <div className="flex flex-col items-center lg:items-start gap-1">
                <div className="flex items-center gap-2 text-secondary text-xs font-mono uppercase">
                  <Trophy size={14} /> Price
                </div>
                <div className="font-bold text-sm">{program.price}</div>
              </div>
              <div className="flex flex-col items-center lg:items-start gap-1">
                <div className="flex items-center gap-2 text-secondary text-xs font-mono uppercase">
                  <Clock size={14} /> Duration
                </div>
                <div className="font-bold text-sm">{eventData.duration}</div>
              </div>
              <div className="flex flex-col items-center lg:items-start gap-1">
                <div className="flex items-center gap-2 text-secondary text-xs font-mono uppercase">
                  <Users size={14} /> Teams
                </div>
                <div className="font-bold text-sm">{eventData.submissions} Teams</div>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
              <a href="/sign-up" className="bh-btn-primary inline-flex items-center gap-2 px-8 py-3 text-base">
                Register Now <ArrowRight size={20} />
              </a>
              <a href="#" className="bh-btn-secondary inline-flex items-center gap-2 px-8 py-3 text-base">
                Add to Calendar <Calendar size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Content Section with Tabs */}
        <div className="space-y-8">
          {/* Tab Navigation */}
          <div className="flex justify-center gap-2 p-1 bh-card rounded-full w-fit mx-auto">
            {Object.entries(tabs).map(([key, { label }]) => (
              <button 
                key={key}
                onClick={() => setActiveTab(key as 'overview' | 'logistics' | 'rewards' | 'gallery' | 'resources')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeTab === key 
                  ? 'bg-background text-primary shadow-sm' 
                  : 'text-secondary hover:text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {tabs[activeTab].content}
          </div>
        </div>
      </div>
    </div>
  );
}
