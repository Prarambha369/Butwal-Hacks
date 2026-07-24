"use client";

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { useUser } from "@auth0/nextjs-auth0/client";
import { APP_URL } from "@/lib/constants";
import Breadcrumbs from "@/components/breadcrumbs"

export function DonorsHero() {
  const { user, isLoading } = useUser();
  const isSignedIn = !!user;

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Donors" }]} />
      <div className="text-center">
        <h1 className="text-4xl sm:text-5xl font-bold font-heading tracking-tight text-primary">
          Donor Recognition Wall
        </h1>
        <p className="mx-auto mt-5 max-w-3xl text-base sm:text-lg text-secondary">
          We are deeply grateful to these individuals and organizations whose generosity makes our mission possible.
          Together, we&apos;re building a stronger tech community in Nepal.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {isLoading ? (
            <div className="h-12 w-44 rounded-full bg-surface-hover animate-pulse" />
          ) : isSignedIn ? (
            <Link
              href={`${APP_URL}/dashboard`}
              className="inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-6 py-3 text-sm font-bold text-white hover:bg-deep-red transition-all active:scale-95"
            >
              Go to Dashboard <ArrowUpRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href={`${APP_URL}/auth/login?screen_hint=signup`}
              className="inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-6 py-3 text-sm font-bold text-white hover:bg-deep-red transition-all active:scale-95"
            >
              Join the Mission <ArrowUpRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
