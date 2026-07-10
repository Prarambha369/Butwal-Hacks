"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CldImage } from 'next-cloudinary';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Programs', href: '/programs' },
  { name: 'Community', href: '/community' },
  { name: 'Governance', href: '/governance' },
  { name: 'Sponsorship', href: '/support' },
  { name: 'Insights', href: '/blog' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 border-b",
        scrolled ? "bg-bg/95 backdrop-blur-md py-3" : "bg-bg py-5",
        "border-border"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-300 transition-transform group-hover:scale-105 overflow-hidden">
                <CldImage
                  width="48"
                  height="48"
                  src="logo_circular"
                  alt="Butwal Hacks Logo"
                  crop="fill"
                />
              </div>
              <span className="text-neutral-50 font-bold text-xl tracking-tight">
                BUTWAL HACKS
              </span>
            </Link>
          </div>

          {/* Center: Nav Links (Desktop) */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-neutral-50 text-sm font-medium opacity-70 transition-all hover:opacity-100 hover:text-red-300"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right: CTA */}
          <div className="hidden md:block">
            <Link
              href="/contact"
              className="rounded-full bg-red-300 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-400 hover:shadow-[0_0_20px_rgba(254,0,0,0.4)] active:scale-95"
            >
              Contact Us
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-neutral-50 p-2"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div 
        className={cn(
          "absolute top-full left-0 w-full bg-bg border-b border-border transition-all duration-300 ease-in-out md:hidden",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        )}
      >
        <div className="flex flex-col p-6 gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="text-neutral-50 text-lg font-medium opacity-70 hover:opacity-100 hover:text-red-300"
            >
              {link.name}
            </Link>
          ))}
          <Link
            href="/contact"
            onClick={() => setIsOpen(false)}
            className="mt-4 rounded-full bg-red-300 px-6 py-3 text-center text-lg font-bold text-white"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </nav>
  );
}
