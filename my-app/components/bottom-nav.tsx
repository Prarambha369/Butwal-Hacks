"use client";

import React from 'react';
import { Home, Layout, Calendar, Users, Info } from 'lucide-react';
import Link from 'next/link';

export default function BottomNav() {
  const navItems = [
    { label: 'Home', icon: <Home size={20} />, href: '/' },
    { label: 'Programs', icon: <Layout size={20} />, href: '/initiatives' },
    { label: 'Events', icon: <Calendar size={20} />, href: '/events' },
    { label: 'People', icon: <Users size={20} />, href: '/community' },
    { label: 'About', icon: <Info size={20} />, href: '/about' },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md md:hidden">
      <div className="bh-glass-surface capsule px-4 py-3 flex items-center justify-around shadow-2xl border-white/20">
        {navItems.map((item) => (
          <Link 
            key={item.label} 
            href={item.href} 
            className="flex flex-col items-center gap-1 p-2 text-text-secondary hover:text-text-primary transition-all group"
          >
            <div className="group-hover:scale-110 transition-transform">
              {item.icon}
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
