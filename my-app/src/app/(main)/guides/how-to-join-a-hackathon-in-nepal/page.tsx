import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";

import Breadcrumbs from "@/components/breadcrumbs";
import { buildPageMetadata } from "@/lib/seo";
import SafeJsonLd from "@/lib/json-ld";
import { faqPageJsonLd } from "@/lib/schema";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = buildPageMetadata({
  title: "How to Join a Hackathon in Nepal | Butwal Hacks",
  description:
    "Step-by-step guide to joining free hackathons in Nepal. Find events, register, form teams, and build your first project with Butwal Hacks in Butwal, Lumbini Province.",
  path: "/guides/how-to-join-a-hackathon-in-nepal",
});

const faqs = [
  {
    q: "Do I need coding experience to join a hackathon in Nepal?",
    a: "No. Beginners are welcome. Many participants come from diverse backgrounds including design, writing, hardware, and business. Butwal Hacks events are beginner-friendly with mentors on hand to help.",
  },
  {
    q: "Are hackathons in Nepal free to attend?",
    a: "Yes. Butwal Hacks runs free hackathons with no registration fees. We provide internet, venue, mentorship, and food. Some events may have travel support for those who need it.",
  },
  {
    q: "Where do hackathons happen in Nepal?",
    a: "Most Butwal Hacks events happen in Butwal, Lumbini Province. We also run initiatives across Nepal through our chapters. Check our Events page for upcoming locations.",
  },
  {
    q: "How do I find a team for a hackathon?",
    a: "You can come solo or with a team. At registration and on event day, we help with team matching based on skills and interests. Our dashboard also has team-matching tools.",
  },
  {
    q: "What should I bring to a hackathon?",
    a: "Bring your laptop, charger, and any hardware you want to use. ID is sometimes required for venue entry. Most essentials like food and internet are provided.",
  },
];

export default function HowToJoinHackathonGuide() {
  const guideUrl = `${SITE_URL}/guides/how-to-join-a-hackathon-in-nepal`;

  return (
    <main className="min-h-dvh bg-background">
      <SafeJsonLd data={faqPageJsonLd(faqs, guideUrl)} />
      <section className="mx-auto max-w-4xl px-4 py-14 sm:py-16">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Guides", href: "/guides" },
            { label: "How to Join a Hackathon in Nepal" },
          ]}
        />
        <h1 className="text-4xl sm:text-5xl font-bold font-heading tracking-tight text-primary mt-4">
          How to Join a Hackathon in Nepal
        </h1>
        <p className="mt-2 text-xs font-mono text-muted-foreground">
          Last updated: 2026-10-29
        </p>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          Hackathons are one of the fastest ways to learn, build, and connect with Nepal&apos;s tech
          community. Here&apos;s a simple, step-by-step guide to joining your first hackathon—especially
          with Butwal Hacks in Butwal, Lumbini Province.
        </p>

        <div className="mt-10 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-primary mb-4">Step 1: Find an upcoming hackathon</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Look for free, beginner-friendly events. Butwal Hacks runs regular hackathons, mini-hackathons,
              and game jams across Lumbini Province. Check the official events page for the latest dates.
            </p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 text-primary-red font-semibold hover:underline"
            >
              Browse upcoming events <ArrowRight className="w-4 h-4" />
            </Link>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-primary mb-4">Step 2: Register for free</h2>
            <p className="text-muted-foreground leading-relaxed">
              Create an account on Butwal Hacks, complete your basic profile, and register for your
              chosen event. Registration is completely free—no fees, no hidden costs. You&apos;ll get event
              updates and access to team matching tools.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-primary mb-4">Step 3: Find a team (or go solo)</h2>
            <p className="text-muted-foreground leading-relaxed">
              Don&apos;t worry if you don&apos;t have a team. Many first-timers come solo. Use our team matching
              on the dashboard or connect with others at the event. Diverse teams—mixing designers,
              developers, and idea people—often build the best projects.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-primary mb-4">Step 4: Show up and build</h2>
            <p className="text-muted-foreground leading-relaxed">
              Arrive on time, attend the kickoff, and start building. Mentors will be there to help
              throughout the event. Focus on solving a real problem, ship something small, and present
              it at demo time. No one expects perfection—just effort and learning.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-primary mb-4">Tips for first-timers</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-primary-red mt-0.5 shrink-0" />
                <span><strong className="text-primary">Start simple.</strong> A working basic solution beats an unfinished complex one.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-primary-red mt-0.5 shrink-0" />
                <span><strong className="text-primary">Ask mentors.</strong> Don&apos;t get stuck for hours—mentors are there to help.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-primary-red mt-0.5 shrink-0" />
                <span><strong className="text-primary">Document everything.</strong> Push to GitHub, take screenshots, and prepare a short demo.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-primary-red mt-0.5 shrink-0" />
                <span><strong className="text-primary">Have fun.</strong> Focus on learning and meeting people—prizes are nice, connections last longer.</span>
              </li>
            </ul>
          </section>
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-primary mb-6">Frequently Asked Questions</h2>
          <div className="border border-border rounded-xl divide-y divide-border">
            {faqs.map((faq, i) => (
              <div key={i} className="p-5">
                <h3 className="font-semibold text-primary mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-10 p-6 rounded-xl border border-primary-red/30 bg-primary-red/5">
          <h3 className="text-xl font-bold text-primary mb-2">Ready to join?</h3>
          <p className="text-muted-foreground mb-4">
            Find your first free hackathon in Butwal, Nepal and start building today.
          </p>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-full bg-bh-red-action px-6 py-3 text-sm font-bold text-white hover:bg-deep-red transition-all"
          >
            View Upcoming Events <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
