"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Github, Linkedin, Instagram, Mail, Facebook, Twitter, MessageCircle } from 'lucide-react';
import { useBhTheme } from '@/components/theme-provider';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useBhTheme();
  
  // Logo Dodging Logic - Using Ref for performance
  const logoRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const glowPosRef = useRef({ x: 0, y: 0 });
  const targetPosRef = useRef({ x: 0, y: 0 });
  const targetGlowPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
    
    // Smooth interpolation loop (lerp)
    let frameId: number;
    const animate = () => {
      if (logoRef.current) {
        // Lerp for Logo
        posRef.current.x += (targetPosRef.current.x - posRef.current.x) * 0.1;
        posRef.current.y += (targetPosRef.current.y - posRef.current.y) * 0.1;
        logoRef.current.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px)`;
      }
      
      if (glowRef.current) {
        // Lerp for Cursor Glow
        glowPosRef.current.x += (targetGlowPosRef.current.x - glowPosRef.current.x) * 0.15;
        glowPosRef.current.y += (targetGlowPosRef.current.y - glowPosRef.current.y) * 0.15;
        glowRef.current.style.transform = `translate(${glowPosRef.current.x}px, ${glowPosRef.current.y}px)`;
      }
      
      frameId = requestAnimationFrame(animate);
    };
    
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!brandRef.current) return;
    
    const rect = brandRef.current.getBoundingClientRect();
    
    // Calculate coordinates relative to the footer element
    // This is critical because the glow div is absolute inside the footer
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;

    // 1. Logic for Logo Dodge
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const diffX = relativeX - centerX;
    const diffY = relativeY - centerY;
    const distance = Math.sqrt(diffX * diffX + diffY * diffY);
    
    if (distance < 250) {
      const force = (250 - distance) / 250;
      targetPosRef.current = {
        x: (diffX / distance) * -80 * force,
        y: (diffY / distance) * -80 * force,
      };
    } else {
      targetPosRef.current = { x: 0, y: 0 };
    }

    // 2. Logic for Glow Effect
    // Center the glow element by subtracting half its width/height (300px)
    targetGlowPosRef.current = {
      x: relativeX - 300,
      y: relativeY - 300,
    };
  };

  return (
    <footer 
      onMouseMove={handleMouseMove}
      className="relative w-full pt-24 pb-12 px-6 md:px-20 border-t border-white/5 overflow-hidden bg-bg-secondary transition-colors duration-500"
    >

      {/* CURSOR GLOW EFFECT */}
      {mounted && (
        <div 
          ref={glowRef}
          className="pointer-events-none absolute w-[600px] h-[600px] rounded-full transition-none z-0"
          style={{
            background: 'radial-gradient(circle, rgba(230, 57, 70, 0.2) 0%, rgba(230, 57, 70, 0) 70%)',
            mixBlendMode: 'screen'
          }}
        />
      )}

      {/* BLUEPRINT GRID BACKGROUND */}
      {mounted && (
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.15] dark:opacity-[0.2]" 
          style={{ 
            backgroundImage: `linear-gradient(var(--blueprint-color), transparent 1px), linear-gradient(90deg, var(--blueprint-color), transparent 1px)`, 
            backgroundSize: '40px 40px' 
          }} 
        />
      )}

      <div className="max-w-7xl mx-auto relative z-10">
        {/* 0. Brand Statement - TOP POSITION */}
        <div className="mb-24 text-center space-y-6">
          <p className="text-3xl md:text-5xl font-bold text-text-primary leading-tight">
            Inclusive. Open. Empowering.
          </p>
          <p className="text-text-secondary text-lg leading-relaxed opacity-80 px-4 max-w-2xl mx-auto">
            A non-profit initiative empowering the next generation of builders in Lumbini Province, Nepal. 
            Decentralizing technology education and driving innovation for everyone.
          </p>
        </div>

        {/* 1. Sitemap Columns - PRIMARY TOP ELEMENT */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-12 mb-24">
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-text-primary opacity-40">Hackathons</h4>
            <ul className="space-y-3">
              {[
                { name: 'Upcoming Events', href: '/events' },
                { name: 'Hackathon Guidelines', href: '/resources/guidelines' },
                { name: 'Past Wins', href: '/events/archive' },
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-text-secondary hover:text-red-500 text-sm transition-colors block">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-text-primary opacity-40">Fellowship</h4>
            <ul className="space-y-3">
              {[
                { name: 'Fellowship Programs', href: '/programs' },
                { name: 'How it Works', href: '/programs/how-it-works' },
                { name: 'Apply Now', href: '/programs/apply' },
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-text-secondary hover:text-red-500 text-sm transition-colors block">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-text-primary opacity-40">Resources</h4>
            <ul className="space-y-3">
              {[
                { name: 'Code of Conduct', href: '/resources/coc' },
                { name: 'Dev Toolbox', href: '/resources/toolbox' },
                { name: 'Branding Assets', href: '/branding' },
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-text-secondary hover:text-red-500 text-sm transition-colors block">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-text-primary opacity-40">About Butwal Hacks</h4>
            <ul className="space-y-3">
              {[
                { name: 'Our Story', href: '/philosophy' },
                { name: 'Team & Board', href: '/community/team' },
                { name: 'Open Collective', href: 'https://opencollective.com/butwal-hacks' },
                { name: 'Contact Us', href: '/contact' },
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} target={link.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="text-text-secondary hover:text-red-500 text-sm transition-colors block">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 2. Huge Brand Identity Section - BOTTOM POSITION */}
        <div 
          ref={brandRef} 
          onMouseMove={handleMouseMove}
          className="flex flex-col items-center text-center space-y-12 pb-24 relative"
        >
          <div className="relative flex flex-col items-center justify-center min-h-[500px] w-full">
            {/* Background SVG Logo - Low Opacity & Dodging */}
            {mounted && (
              <div 
                ref={logoRef}
                className="absolute transition-none pointer-events-none z-0 opacity-10 dark:opacity-20"
              >
                <Image 
                  src="/Logo_Circular.svg" 
                  alt="Butwal Hacks Background" 
                  width={400} 
                  height={400} 
                  className="object-contain"
                  priority
                />
              </div>
            )}
            
            {/* Foreground Brand Text */}
            <div className="relative z-10 flex flex-col items-center">
              <span className="font-black text-5xl md:text-8xl tracking-tighter text-text-primary">
                Butwal<span className="text-red-500">Hacks</span>
              </span>
              <span className="text-xs md:text-base text-red-500 font-bold uppercase tracking-[0.4em] mt-4">Ignite. Unite. Lead.</span>
            </div>
          </div>
          
          <div className="max-w-3xl space-y-8">
            {/* Brand Statement moved to top */}
          </div>
        </div>

        {/* 3. Bottom Bar - Minimalist Mono */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-4 items-center md:items-start">
            <div className="text-[11px] text-text-secondary font-mono leading-relaxed text-center md:text-left opacity-60">
              © {currentYear} Butwal Hacks. A community-led collective funded via Open Collective and local contributions.
            </div>
            <button 
              onClick={toggleTheme}
              className="flex items-center gap-2 text-[10px] font-bold text-text-secondary hover:text-text-primary transition-colors uppercase tracking-widest"
            >
              <div className={`w-3 h-3 rounded-full transition-colors ${theme === 'dark' ? 'bg-text-primary' : 'bg-text-secondary'}`} />
              Toggle Theme
            </button>
          </div>
          <div className="flex items-center gap-6 text-[10px] font-bold text-text-secondary uppercase tracking-widest">
            <Link href="/privacy" className="hover:text-text-primary transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-text-primary transition-colors">Terms</Link>
            <Link href="/cookies" className="hover:text-text-primary transition-colors">Cookies</Link>
            <Link href="/legal" className="hover:text-text-primary transition-colors">Legal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}