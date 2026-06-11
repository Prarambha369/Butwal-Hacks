"use client";

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function LiquidGlassNav() {
  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-4xl">
      <div className="liquid-glass capsule px-6 py-3 flex items-center justify-between shadow-lg transition-all duration-300 hover:shadow-xl">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-apple-bold text-lg">
            Liquid<span className="text-blue-500">Glass</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-text-secondary">
            <Link href="#philosophy" className="hover:text-text-primary transition-colors">Philosophy</Link>
            <Link href="#geometry" className="hover:text-text-primary transition-colors">Geometry</Link>
            <Link href="#continuity" className="hover:text-text-primary transition-colors">Continuity</Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-sm font-medium px-4 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            Sign In
          </button>
          <button className="capsule bg-blue-600 text-white text-sm font-bold px-4 py-2 hover:bg-blue-700 transition-all active:scale-95 shadow-sm">
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}
