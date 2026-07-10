"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from "next/image";
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const footerRef = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);
  
  const logoRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const glowPosRef = useRef({ x: 0, y: 0 });
  const targetPosRef = useRef({ x: 0, y: 0 });
  const targetGlowPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0 }
    );
    observer.observe(el);

    let frameId: number;
    const animate = () => {
      if (logoRef.current) {
        posRef.current.x += (targetPosRef.current.x - posRef.current.x) * 0.1;
        posRef.current.y += (targetPosRef.current.y - posRef.current.y) * 0.1;
        logoRef.current.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px)`;
      }
      
      if (glowRef.current) {
        glowPosRef.current.x += (targetGlowPosRef.current.x - glowPosRef.current.x) * 0.15;
        glowPosRef.current.y += (targetGlowPosRef.current.y - glowPosRef.current.y) * 0.15;
        glowRef.current.style.transform = `translate(${glowPosRef.current.x}px, ${glowPosRef.current.y}px)`;
      }
      
      frameId = requestAnimationFrame(animate);
    };
    
    frameId = requestAnimationFrame(animate);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameId);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!brandRef.current) return;
    
    const rect = brandRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;

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

    targetGlowPosRef.current = {
      x: relativeX - 300,
      y: relativeY - 300,
    };
  };

  return (
    <footer 
      ref={footerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full pt-24 pb-12 px-6 md:px-20 border-t border-border overflow-hidden bg-bg transition-colors duration-500"
    >

      {/* CURSOR GLOW EFFECT */}
      {isInView && (
        <div 
          ref={glowRef}
          className="pointer-events-none absolute w-[600px] h-[600px] rounded-full transition-none z-0 [background:radial-gradient(circle,var(--glow-bh-red)_0%,transparent_70%)] [mix-blend-mode:screen]"
        />
      )}

      {/* BLUEPRINT GRID BACKGROUND */}
      {isInView && (
        <div 
          className="absolute inset-0 pointer-events-none opacity-20 [backgroundImage:linear-gradient(var(--glass-border)_1px,transparent_1px),linear-gradient(90deg,var(--glass-border)_1px,transparent_1px)] [backgroundSize:40px_40px]" 
        />
      )}

      <div className="max-w-7xl mx-auto relative z-10">
        {/* 0. Brand Statement - TOP POSITION */}
        <div className="mb-24 text-center space-y-6">
          <p className="text-3xl md:text-5xl font-bold text-neutral-50 leading-tight">
            Inclusive. Open. Empowering.
          </p>
          <p className="text-neutral-300 text-lg leading-relaxed opacity-80 px-4 max-w-2xl mx-auto">
            A non-profit initiative empowering the next generation of builders in Lumbini Province, Nepal. 
            Decentralizing technology education and driving innovation for everyone.
          </p>
        </div>

        {/* 1. Sitemap Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-12 mb-24">
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-neutral-50 opacity-40">Hackathons</h4>
            <ul className="space-y-3">
              {[
                { name: 'Upcoming Events', href: '/events' },
                { name: 'Hackathon Guidelines', href: '/resources/guidelines' },
                { name: 'Past Wins', href: '/events/archive' },
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-neutral-300 hover:text-red-300 text-sm transition-colors block">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-neutral-50 opacity-40">Fellowship</h4>
            <ul className="space-y-3">
              {[
                { name: 'Fellowship Programs', href: '/programs' },
                { name: 'How it Works', href: '/programs/how-it-works' },
                { name: 'Apply Now', href: '/programs/apply' },
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-neutral-300 hover:text-red-300 text-sm transition-colors block">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-neutral-50 opacity-40">Resources</h4>
            <ul className="space-y-3">
              {[
                { name: 'Code of Conduct', href: '/resources/coc' },
                { name: 'Dev Toolbox', href: '/resources/toolbox' },
                { name: 'Branding Assets', href: '/branding' },
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-neutral-300 hover:text-red-300 text-sm transition-colors block">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-neutral-50 opacity-40">About Butwal Hacks</h4>
            <ul className="space-y-3">
              {[
                { name: 'Our Story', href: '/philosophy' },
                { name: 'Team & Board', href: '/community/team' },
                { name: 'Open Collective', href: 'https://opencollective.com/butwal-hacks' },
                { name: 'Contact Us', href: '/contact' },
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} target={link.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="text-neutral-300 hover:text-red-300 text-sm transition-colors block">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 2. Huge Brand Identity Section */}
        <div 
          ref={brandRef} 
          onMouseMove={handleMouseMove}
          className="flex flex-col items-center text-center space-y-12 pb-24 relative"
        >
          <div className="relative flex flex-col items-center justify-center min-h-[500px] w-full">
            {isInView && (
              <div 
                ref={logoRef}
                className="absolute transition-none pointer-events-none z-0 opacity-20"
              >
                <Image 
                  src="/Logo_Circular.svg" 
                  alt="Butwal Hacks Background" 
                  fill
                  className="object-contain"
                />
              </div>
            )}
            
            <div className="relative z-10 flex flex-col items-center">
              <span className="font-black text-5xl md:text-8xl tracking-tighter text-neutral-50">
                Butwal<span className="text-red-300">Hacks</span>
              </span>
              <span className="text-xs md:text-base text-red-300 font-bold uppercase tracking-[0.4em] mt-4">Ignite. Unite. Lead.</span>
            </div>
          </div>
        </div>

        {/* 3. Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-4 items-center md:items-start">
            <div className="text-[11px] text-neutral-300 font-mono leading-relaxed text-center md:text-left opacity-60">
              © {currentYear} Butwal Hacks. A community-led collective funded via Open Collective and local contributions.
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-300 uppercase tracking-widest">
              <ThemeToggle />
              Toggle Theme
            </div>
          </div>
          <div className="flex items-center gap-6 text-[10px] font-bold text-neutral-300 uppercase tracking-widest">
            <Link href="/privacy" className="hover:text-red-300 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-red-300 transition-colors">Terms</Link>
            <Link href="/cookies" className="hover:text-red-300 transition-colors">Cookies</Link>
            <Link href="/legal" className="hover:text-red-300 transition-colors">Legal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
