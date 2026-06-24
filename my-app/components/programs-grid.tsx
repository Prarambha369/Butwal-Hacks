"use client";

import React from 'react';

const programs = [
  {
    title: "Annual Hackathon",
    description: "Butwal's premier 48-hour build-fest. Turning raw ideas into shipping products.",
    status: "Coming Soon",
    isLive: false,
    image: "https://images.unsplash.com/photo-1504384308090-c894fdbe539b?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Daydream Butwal",
    description: "A focused series of design sprints and ideation workshops for the next-gen creators.",
    status: "Active",
    isLive: true,
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Game Jam",
    description: "Exploring the boundaries of interactive storytelling and game mechanics in Nepal.",
    status: "Upcoming",
    isLive: false,
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Fellowship",
    description: "Long-term mentorship for high-potential builders looking to scale their impact.",
    status: "Applications Open",
    isLive: true,
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800",
  }
];

export default function ProgramsGrid() {
  return (
    <section className="py-20 w-full max-w-6xl mx-auto px-6 md:px-20 space-y-12">
      <div className="text-left space-y-4">
        <span className="bh-badge">Active Initiatives</span>
        <h2 className="bh-h2">Build the Future.</h2>
        <p className="text-text-secondary max-w-2xl">
          From high-intensity hackathons to long-term fellowships, we provide the 
          infrastructure for the most ambitious builders in Lumbini Province.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {programs.map((program, i) => (
          <div key={i} className="bh-card group hover:-translate-y-2 transition-all duration-300 flex flex-col h-full">
            <div className="bh-card-inner mb-6 aspect-video relative">
              <img 
                src={program.image} 
                alt={program.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 right-3">
                <span className={`bh-badge ${program.isLive ? 'bh-badge-live' : ''}`}>
                  {program.status}
                </span>
              </div>
            </div>
            
            <h3 className="text-xl font-bold mb-3 text-text-primary">{program.title}</h3>
            <p className="text-text-secondary text-sm leading-relaxed mb-6 flex-1">
              {program.description}
            </p>
            
            <button className="bh-btn-secondary w-full py-3 text-sm">
              Learn More
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
