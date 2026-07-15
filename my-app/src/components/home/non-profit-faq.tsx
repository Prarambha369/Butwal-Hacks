"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FAQItem } from "@/types/impact";

const faqs: FAQItem[] = [
  {
    id: "free",
    question: "Is this really free?",
    answer:
      "Yes. 100% free. No membership fees, no event ticket charges, no hidden costs. Butwal Hacks is funded transparently through Open Collective. Every rupee we receive is publicly tracked — our community believes access to tech should never have a price tag.",
  },
  {
    id: "who-can-join",
    question: "Who can join?",
    answer:
      "Any student or young technologist in Nepal. You don't need to know how to code — we welcome designers, hardware tinkerers, writers, and anyone curious about technology. If you're in Butwal, Pokhara, Kathmandu, or anywhere in Nepal, you belong here.",
  },
  {
    id: "donations",
    question: "How do you use donations?",
    answer:
      "Transparently. 100% of funds go to community programs — event venues, food, prizes, learning resources, and infrastructure. Our budget is publicly visible on our Open Collective page. No administrative overhead, no salaries — we're all volunteers.",
  },
  {
    id: "volunteer",
    question: "How can I volunteer?",
    answer:
      "Three ways: become a Mentor (share your skills), join our Organizer team (help run events), or contribute on GitHub (our entire platform is open-source). Join our Discord or fill out the volunteer form on the Community page.",
  },
  {
    id: "events",
    question: "When and where are events?",
    answer:
      "We host events across Nepal through our chapter system. Butwal chapter hosts regular HackDays and workshops. Pokhara and Kathmandu chapters run quarterly hackathons. Check our Events page for the latest schedule, or join your local chapter.",
  },
  {
    id: "nonprofit-status",
    question: "Are you a registered nonprofit?",
    answer:
      "Butwal Hacks operates as a youth-led nonprofit initiative under the Nepal Hacks Foundation. We use Open Collective for transparent financial management. We are building toward formal nonprofit registration in Nepal.",
  },
];

export default function NonProfitFAQ() {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section aria-labelledby="faq-heading" className="py-16 md:py-24 bg-background border-b border-border">
      <div className="mx-auto max-w-3xl px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-red/5 border border-primary-red/10 mb-4">
            <span className="text-[10px] font-mono font-semibold text-primary-red">questions answered</span>
          </div>
          <h2 id="faq-heading" className="text-3xl md:text-4xl font-bold text-primary">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto text-sm">
            Everything you need to know about Butwal Hacks as a community-driven nonprofit.
          </p>
        </div>

        <div className="border border-border rounded-xl divide-y divide-border bg-background">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div key={faq.id}>
                <h3>
                  <button
                    onClick={() => toggle(faq.id)}
                    className="flex items-center justify-between w-full px-5 py-4 text-left transition-colors hover:bg-surface-hover"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${faq.id}`}
                    id={`faq-trigger-${faq.id}`}
                  >
                    <span className="text-sm font-semibold text-primary pr-4">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                <div
                  id={`faq-panel-${faq.id}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${faq.id}`}
                  aria-hidden={!isOpen}
                  className={`overflow-hidden transition-all duration-200 ease-in-out ${
                    isOpen ? "max-h-96 opacity-100 pb-4" : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="px-5 text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
