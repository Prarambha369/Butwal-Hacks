"use client";

import Link from 'next/link';
import { Mail } from 'lucide-react';
import AuthAwareCta from '@/components/auth-aware-cta';

export default function ContactCTA() {
  return (
    <section className="relative w-full py-20 md:py-28 bg-surface-inverse overflow-hidden">

      <div className="relative bh-container text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 max-w-3xl mx-auto leading-tight">
          Build your first project with us
        </h2>
        <p className="text-base md:text-lg text-white/70 mb-8 max-w-xl mx-auto">
          No registration fees. No experience required. Just show up and build alongside fellow students across Nepal.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <AuthAwareCta
            actionHref="/dashboard/hacker"
            actionLabel="Start Building"
            returnTo="/"
            className="py-3.5 text-base"
          />
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-medium rounded-full px-8 py-3.5 text-base transition-all duration-200 active:scale-[0.97]"
          >
            <Mail className="h-4 w-4" />
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
}
