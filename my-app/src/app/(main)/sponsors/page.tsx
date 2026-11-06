import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/breadcrumbs";
import { buildPageMetadata } from "@/lib/seo";
import SponsorsIndexClient from "./sponsors-index-client";
import { createServiceClient } from "@/utils/supabase";
import { logger } from "@/lib/logger";

export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  title: "Sponsors — Butwal Hacks",
  description:
    "Organisations and institutions that back free hackathons and student builder programs across Lumbini, Nepal.",
  path: "/sponsors",
  keywords: [
    "Butwal Hacks sponsors",
    "sponsorship Nepal",
    "support youth tech Nepal",
    "Lumbini hackathon sponsors",
  ],
});

interface SponsorRow {
  id: string;
  company_name: string | null;
  company_website: string | null;
  company_logo_url: string | null;
  description: string | null;
  locations: string[] | null;
  industries: string[] | null;
  created_at: string | null;
}

async function fetchSponsors(): Promise<SponsorRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("sponsor_profiles")
    .select("id, company_name, company_website, company_logo_url, description, locations, industries, created_at")
    .order("company_name", { ascending: true })
    .limit(100);

  if (error) {
    // A bare `return []` rendered the "no sponsors yet" empty state for every
    // failure, a missing table included, so the page looked healthy while the
    // query was dead. Log the PostgREST code first, then keep the fallback.
    logger.error("[sponsors] sponsor_profiles read failed", {
      code: error.code,
      message: error.message,
    });
    return [];
  }
  return (data ?? [])
    .filter((s) => s.company_name && s.company_name.trim() !== "")
    .sort((a, b) => (a.company_name ?? "").localeCompare(b.company_name ?? ""));
}

export default async function SponsorsPage() {
  const sponsors = await fetchSponsors();

  // Derive distinct filter values from the current set of sponsors.
  const industries = Array.from(
    new Set(sponsors.flatMap((s) => s.industries ?? []).filter(Boolean)),
  ).sort();
  const locations = Array.from(
    new Set(sponsors.flatMap((s) => s.locations ?? []).filter(Boolean)),
  ).sort();

  return (
    <main className="min-h-dvh bg-background">
      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Sponsors" },
          ]}
        />

        <div className="mt-8 mb-10">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
            Our supporters
          </p>
          <h1 className="mt-3 text-5xl font-bold font-heading tracking-tight text-primary sm:text-6xl">
            Sponsors &amp; partners
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-secondary sm:text-lg">
            The companies and institutions that make our programs free for
            student participants — funding venues, materials, connectivity, and
            travel for builders who need it.
          </p>
        </div>

        {sponsors.length === 0 ? (
          <div className="mx-auto max-w-2xl text-center">
            <div className="rounded-xl border border-border bg-surface/40 p-10">
              <p className="text-sm text-muted-foreground">
                No sponsors have added their profile yet.{" "}
                <Link
                  href="/support"
                  className="font-semibold text-primary-red hover:underline"
                >
                  Get in touch
                </Link>{" "}
                if your organisation would like to back student builders in
                Lumbini.
              </p>
            </div>
          </div>
        ) : (
          <SponsorsIndexClient
            sponsors={sponsors}
            industries={industries}
            locations={locations}
          />
        )}
      </section>
    </main>
  );
}
