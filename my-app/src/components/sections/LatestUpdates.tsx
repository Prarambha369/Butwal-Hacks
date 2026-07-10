"use client";

import React, { useState } from 'react';
import { FadeIn } from '@/components/home/shared-primitives';
import { cn } from '@/lib/utils';

const faqs = [
  {
    question: "What is Butwal Hacks?",
    answer: "Butwal Hacks is a nonprofit youth technology initiative in Butwal, Nepal, dedicated to decentralizing technology education and fostering innovation for youth in the Lumbini Province.",
  },
  {
    question: "How can I join the community?",
    answer: "You can join by creating a profile on our platform, participating in our hackathons, or applying for volunteer positions in our various initiatives.",
  },
  {
    question: "Is it free to participate in Butwal Hacks events?",
    answer: "Yes, our core mission is to provide free access to quality tech education and mentorship for youth in Nepal.",
  },
  {
    question: "How do I get verified as a 'Trusted Hacker'?",
    answer: "Verification is granted based on your contributions, project shipments, and GitHub verification. The more you build and share, the higher your trust marker.",
  },
];

export default function LatestUpdates() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="relative w-full overflow-hidden">
      <FadeIn>
        <div className="absolute inset-0 bg-gradient-to-r from-red-300 to-red-400" />
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none" 
          style={{ 
            backgroundImage: `linear-gradient(45deg, transparent 45%, var(--color-text-primary) 50%, transparent 55%)`,
            backgroundSize: '100px 100px' 
          }} 
        />

        <div className="relative mx-auto max-w-4xl px-4 py-24 md:py-32 text-center">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
            Latest Updates
          </h2>
          <p className="text-xl md:text-2xl font-medium text-white/90 mb-16">
            From the Community Desk
          </p>

          <div className="text-left bg-bg rounded-3xl border border-border overflow-hidden">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-border last:border-b-0">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-neutral-600/50 transition-colors"
                >
                  <span className="text-neutral-50 font-bold text-lg">{faq.question}</span>
                  <span className={cn(
                    "text-red-300 transition-transform duration-300",
                    openIndex === index ? "rotate-45" : ""
                  )}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </span>
                </button>
                <div 
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="p-6 pt-0 text-neutral-300 leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>
    </section>
  );
}


