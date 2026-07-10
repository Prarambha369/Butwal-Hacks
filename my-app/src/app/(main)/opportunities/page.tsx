import type { Metadata } from "next";
import Link from "next/link";
import { getPublicOpportunities } from "@/lib/actions/sponsor-opportunities";
import { buildPageMetadata } from "@/lib/seo";
import { Briefcase, ExternalLink, MapPin, DollarSign, Clock } from "lucide-react";
export const metadata: Metadata = buildPageMetadata({
  title: "Opportunities & Bounties",
  description: "Browse jobs, internships, grants, and bounties from sponsors supporting the Butwal Hacks community.",
  path: "/opportunities",
});

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  job: "Job",
  internship: "Internship",
  grant: "Grant",
  bounty: "Bounty",
  other: "Other",
};

export default async function OpportunitiesPage() {
  const [jobs, bounties] = await Promise.all([
    getPublicOpportunities({ is_bounty: false }),
    getPublicOpportunities({ is_bounty: true }),
  ]);

  return (
    <main className="min-h-screen bg-background text-primary">
      {/* Hero */}
      <section className="border-b border-glass px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl text-center">
          <p className="inline-flex rounded-full border border-bh-red-500/30 bg-bh-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-bh-red-500">
            Sponsor Opportunities
          </p>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Build with <span className="text-bh-red-500">Purpose</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-secondary sm:text-lg">
            Jobs, internships, grants, and bounties from organizations investing in Nepal&apos;s next generation of builders.
          </p>
        </div>
      </section>

      {/* Bounties Section */}
      {bounties.length > 0 && (
        <section className="border-b border-glass px-4 py-12">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">🏆 Bounty Board</h2>
                <p className="text-sm text-secondary mt-1">Complete challenges and earn rewards</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-status-yellow/20 text-status-yellow text-xs font-bold border border-status-yellow/30">
                {bounties.length} active
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bounties.map((bounty: any) => (
                <div key={bounty.id} className="lg-surface rounded-2xl border border-glass p-5 hover:border-status-yellow/50 transition-all space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-status-yellow/20 text-status-yellow border border-status-yellow/30 text-[10px] font-bold">
                      BOUNTY
                    </span>
                    {bounty.bounty_amount && (
                      <span className="text-lg font-bold text-status-yellow">${bounty.bounty_amount}</span>
                    )}
                  </div>
                  <h3 className="font-bold text-primary">{bounty.title}</h3>
                  <p className="text-xs text-secondary line-clamp-2">{bounty.description}</p>
                  {bounty.skills_required?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {bounty.skills_required.slice(0, 4).map((s: string) => (
                        <span key={s} className="px-2 py-0.5 rounded-md bg-surface/10 border border-glass text-[10px] text-secondary">{s}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-glass">
                    <span className="text-[10px] text-secondary/60 flex items-center gap-1">
                      <Clock size={10} /> {new Date(bounty.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] text-secondary/60">
                      {bounty.sponsor_profiles?.company_name || "Sponsor"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Opportunities */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold mb-6">All Opportunities</h2>

          {jobs.length === 0 ? (
            <div className="lg-surface rounded-2xl border border-glass p-12 text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-surface/10 flex items-center justify-center mb-4">
                <Briefcase size={28} className="text-secondary" />
              </div>
              <h3 className="text-base font-bold text-primary mb-1">No opportunities yet</h3>
              <p className="text-sm text-secondary max-w-sm mx-auto">
                Opportunities from sponsors will appear here. Check back soon!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((opp: any) => (
                <div key={opp.id} className="lg-surface rounded-2xl border border-glass p-5 hover:border-bh-red-500/30 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    {/* Company logo */}
                    {opp.sponsor_profiles?.company_logo_url && (
                      <div className="w-12 h-12 rounded-xl bg-surface/20 overflow-hidden flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={opp.sponsor_profiles.company_logo_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-surface/20 border border-glass text-[10px] font-bold uppercase text-secondary">
                          {TYPE_LABELS[opp.type] || opp.type}
                        </span>
                        {opp.is_remote && <span className="text-[10px] text-secondary/60">🌐 Remote</span>}
                      </div>
                      <h3 className="font-bold text-primary">{opp.title}</h3>
                      <p className="text-xs text-secondary line-clamp-2">{opp.description}</p>
                      {opp.skills_required?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {opp.skills_required.slice(0, 6).map((s: string) => (
                            <span key={s} className="px-2 py-0.5 rounded-md bg-surface/10 border border-glass text-[10px] text-secondary">{s}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-[11px] text-secondary/60">
                        {opp.sponsor_profiles?.company_name && (
                          <span className="font-medium text-primary/60">{opp.sponsor_profiles.company_name}</span>
                        )}
                        {opp.location && <span className="flex items-center gap-1"><MapPin size={11} />{opp.location}</span>}
                        {opp.compensation && <span className="flex items-center gap-1"><DollarSign size={11} />{opp.compensation}</span>}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {opp.application_url ? (
                        <a
                          href={opp.application_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-bh-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-bh-red-600 transition-all"
                        >
                          Apply <ExternalLink size={11} />
                        </a>
                      ) : (
                        <span className="text-[10px] text-secondary/60">Apply on platform</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
