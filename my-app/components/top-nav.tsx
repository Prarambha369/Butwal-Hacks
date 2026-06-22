"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown, Sun, Moon, Heart } from 'lucide-react';
import { useBhTheme } from '@/components/theme-provider';

export default function TopNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { theme, toggleTheme } = useBhTheme();

  const navStructure = {
    about: {
      label: 'About',
      sub: ['Philosophy', 'Philanthropy', 'Team & Boards', 'Jobs', 'Branding Guide', 'Press Inquiries']
    },
    programs: {
      label: 'Programs',
      sub: ['Hackathons', 'Workshops', 'Fellowships', 'Bootcamps']
    },
    resources: {
      label: 'Resources',
      sub: ['Blog', 'Toolbox', 'Codebase', 'Documentation', 'Privacy & Terms', 'Safety']
    }
  };

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl">
      <div className="bh-glass-surface capsule px-4 md:px-8 py-3 flex items-center justify-between transition-all duration-500 hover:shadow-2xl">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-8 h-8 transition-transform group-hover:scale-110 overflow-hidden rounded-md">
            <img 
              src="/Logo.jpeg" 
              alt="Butwal Hacks Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-bold text-sm md:text-lg tracking-tight hidden sm:block">
            Butwal<span className="text-red-500">Hacks</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1 text-sm font-medium">
          {Object.entries(navStructure).map(([key, value]) => {
            const { label, sub } = value;
            return (
              <div 
                key={key} 
                className="relative group"
                onMouseEnter={() => setActiveDropdown(key)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center gap-1 px-4 py-2 rounded-full text-text-secondary hover:text-text-primary transition-colors">
                  {label}
                  <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === key ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Mega Dropdown */}
                {activeDropdown === key && (
                  <div className="absolute top-full left-0 w-64 bh-glass-surface rounded-[24px] p-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex flex-col gap-1">
                      {sub.map(item => (
                        <Link 
                          key={item} 
                          href={`/${key}/${item.toLowerCase().replace(/\s+/g, '-')}`} 
                          className="px-4 py-2 rounded-xl text-text-primary hover:bg-red-500/10 hover:text-red-500 transition-all text-sm font-medium"
                        >
                          {item}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Donate Link */}
          <Link 
            href="/donate" 
            className="flex items-center gap-1 px-4 py-2 rounded-full text-red-400 hover:text-red-500 transition-colors font-semibold"
          >
            <Heart size={14} className="fill-current" />
            Donate
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 md:gap-6">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-full hover:bg-white/10"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button className="bh-btn-primary text-xs md:text-sm px-5 py-2">
            Join Community
          </button>

          {/* Mobile Toggle */}
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="lg:hidden p-2 text-text-primary hover:bg-white/10 rounded-full transition-colors"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-4 bh-glass-surface rounded-[32px] p-6 flex flex-col gap-6 lg:hidden animate-in fade-in slide-in-from-top-4 duration-300 shadow-2xl">
          {Object.entries(navStructure).map(([key, value]) => {
            const { label, sub } = value;
            return (
              <div key={key} className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-red-500 px-4">{label}</span>
                <div className="grid grid-cols-2 gap-2">
                  {sub.map(item => (
                    <Link 
                      key={item} 
                      href={`/${key}/${item.toLowerCase().replace(/\s+/g, '-')}`} 
                      className="px-4 py-2 rounded-xl text-text-primary hover:bg-red-500/10 hover:text-red-500 transition-all text-xs font-medium"
                    >
                      {item}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
          
          {/* Donate Link for Mobile */}
          <Link 
            href="/donate" 
            className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-500/10 text-red-500 font-bold text-sm border border-red-500/20"
          >
            <Heart size={16} className="fill-current" />
            Support the Movement
          </Link>
        </div>
      )}
    </nav>
  );
}
