import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Home, Mail } from "lucide-react";
import { Ballu } from "@/components/mascot/ballu";
import { APP_MAINTENANCE, isAppMaintenance } from "@/lib/app-maintenance";

/**
 * "Under maintenance": what every app path (sign-in, dashboard, portal,
 * profiles, ...) shows on the static marketing site while the app is paused.
 * The static site's _redirects serve this page in place of those paths
 * (lib/static-site.ts). Exists only while lib/app-maintenance.ts is on, and
 * only in the static export; a 404 everywhere else.
 */
export const metadata: Metadata = {
  title: "Under maintenance — Butwal Hacks",
  description: "Sign-in, dashboards and event registration are under maintenance and back soon.",
  robots: { index: false, follow: true },
};

export default function MaintenancePage() {
  if (!isAppMaintenance() || !APP_MAINTENANCE) notFound();
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="max-w-lg space-y-6 text-center">
        <Ballu emotion="question" size={120} />
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-primary">Under maintenance</h1>
          <p className="text-sm leading-relaxed text-secondary">
            The Butwal Hacks app, which covers sign-in, dashboards, profiles, teams, certificates and event
            registration, is under maintenance. It will be back by{" "}
            <strong className="text-primary">{APP_MAINTENANCE.backBy}</strong>.
          </p>
          <p className="text-sm leading-relaxed text-secondary">
            Your account and data are safe. Events, the gallery, the blog and every policy page on this site are
            available as usual.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-bh-red-action px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-deep-red"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Home
          </Link>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-2.5 text-sm font-bold text-primary transition-all hover:bg-surface-hover"
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Events
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-2.5 text-sm font-bold text-primary transition-all hover:bg-surface-hover"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            Contact us
          </Link>
        </div>
      </div>
    </div>
  );
}
