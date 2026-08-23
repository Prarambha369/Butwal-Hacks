"use client";

import { Mail, Sparkles } from "lucide-react"
import Link from "next/link"
import { FadeIn } from "@/components/home/shared-primitives"
import AuthAwareCta from "@/components/auth-aware-cta"

export function CommunityCTA() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden" aria-label="Join the Community">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary-red/5 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary-red/10 blur-[120px] pointer-events-none" />

      <FadeIn className="relative mx-auto max-w-3xl px-4 text-center">
        <Sparkles className="w-10 h-10 text-primary-red mx-auto mb-6" />
        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-primary">
          Ready to Build?
        </h2>
        <p className="mt-4 text-lg text-secondary max-w-xl mx-auto leading-relaxed">
          Whether you&apos;re writing your first line of code or shipping your tenth project —
          there&apos;s a place for you here.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <AuthAwareCta
            actionHref="/dashboard/hacker"
            actionLabel="Create Your Profile"
            returnTo="/community"
            className="py-3.5"
          />
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-surface/30 px-8 py-3.5 text-sm font-bold text-primary hover:bg-surface/50 transition-all"
          >
            Get in Touch <Mail className="w-4 h-4" />
          </Link>
        </div>
      </FadeIn>
    </section>
  )
}
