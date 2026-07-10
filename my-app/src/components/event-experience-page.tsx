"use client";

interface TimelineItem {
  time: string;
  title: string;
  note: string;
}

interface TeamMember {
  name: string;
  role: string;
}

interface FAQ {
  q: string;
  a: string;
}

interface EventExperiencePageProps {
  title: string;
  status: string;
  dateLabel: string;
  summary: string;
  initiativeLabel: string;
  initiativeHref: string;
  venue: string;
  locationLabel: string;
  prizeLabel: string;
  heroTag: string;
  timeline: TimelineItem[];
  team: TeamMember[];
  faqs: FAQ[];
  slug?: string;
}

export default function EventExperiencePage(props: EventExperiencePageProps) {
  const { title, status, dateLabel, summary, venue, locationLabel, prizeLabel, heroTag, timeline, team, faqs, slug, initiativeLabel: _initiativeLabel, initiativeHref: _initiativeHref } = props;

  return (
    <main className="min-h-screen bg-background text-primary">
      <section className="relative px-6 py-24 md:py-32 border-b border-glass">
        <div className="mx-auto max-w-4xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bh-red-500/10 text-bh-red-500 text-xs font-bold uppercase tracking-widest border border-bh-red-500/20">
            {heroTag}
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight">{title}</h1>
          <p className="text-xl text-secondary max-w-2xl mx-auto">{summary}</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm font-mono text-secondary">
            <span>{dateLabel}</span>
            <span>•</span>
            <span>{locationLabel}</span>
          </div>
          {slug && (
            <div className="pt-4">
              <a
                href={`/events/${slug}/projects`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-bh-red-500 text-white text-sm font-bold hover:bg-bh-red-600 transition-all"
              >
                Browse Projects
              </a>
            </div>
          )}
        </div>
      </section>

      <section className="px-6 py-16 border-b border-glass">
        <div className="mx-auto max-w-4xl space-y-8">
          <h2 className="text-3xl font-bold">Event Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Status", value: status === "completed" ? "Completed" : "Upcoming" },
              { label: "Venue", value: venue },
              { label: "Location", value: locationLabel },
              { label: "Prizes", value: prizeLabel },
            ].map((item) => (
              <div key={item.label} className="lg-surface rounded-2xl p-4 border border-glass text-center">
                <div className="text-xs font-mono text-secondary uppercase tracking-wider">{item.label}</div>
                <div className="mt-2 text-sm font-bold">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {timeline.length > 0 && (
        <section className="px-6 py-16 border-b border-glass">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold mb-8">Timeline</h2>
            <div className="space-y-6">
              {timeline.map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-24 shrink-0 pt-1">
                    <span className="text-sm font-mono text-bh-red-500">{item.time}</span>
                  </div>
                  <div className="flex-1 pb-6 border-l border-glass pl-6 relative">
                    <div className="absolute left-[-4px] top-2 w-2 h-2 rounded-full bg-bh-red-500" />
                    <h3 className="font-bold">{item.title}</h3>
                    <p className="text-sm text-secondary mt-1">{item.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {team.length > 0 && (
        <section className="px-6 py-16 border-b border-glass">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold mb-8">Team</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {team.map((member) => (
                <div key={member.name} className="lg-surface rounded-2xl p-4 border border-glass text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-bh-red-500/20 flex items-center justify-center text-bh-red-500 font-bold text-lg">
                    {member.name.charAt(0)}
                  </div>
                  <div className="mt-3 font-bold text-sm">{member.name}</div>
                  <div className="text-xs text-secondary">{member.role}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {faqs.length > 0 && (
        <section className="px-6 py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold mb-8">FAQ</h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="lg-surface rounded-2xl p-6 border border-glass">
                  <h3 className="font-bold mb-2">{faq.q}</h3>
                  <p className="text-sm text-secondary">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
