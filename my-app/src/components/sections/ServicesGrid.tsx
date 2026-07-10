import React from 'react';
import { StaggerReveal } from '@/components/home/shared-primitives';
import { BookOpen, Handshake, Rocket, Code2 } from 'lucide-react';

const services = [
  {
    title: 'Learning Programs',
    description: 'Structured pathways from curiosity to contribution, with clear roles and real outcomes.',
    icon: BookOpen,
  },
  {
    title: 'Mentorship',
    description: 'Domain experts guide learners through real problem-solving and hands-on execution.',
    icon: Handshake,
  },
  {
    title: 'Hackathons',
    description: 'Structured 24–48 hour build cycles where teams ship working prototypes from scratch.',
    icon: Rocket,
  },
  {
    title: 'Open Projects',
    description: 'Collaborative initiatives that stay active beyond events and invite ongoing contribution.',
    icon: Code2,
  },
];

export default function ServicesGrid() {
  return (
    <section className="w-full bg-bg py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <StaggerReveal>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <div 
                key={service.title}
                className="group relative p-8 rounded-2xl bg-neutral-600 border border-neutral-500 transition-all duration-300 hover:-translate-y-2 hover:border-red-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
              >
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-red-300/10 text-red-300 group-hover:bg-red-300 group-hover:text-white transition-colors">
                  <service.icon className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-50 mb-4">
                  {service.title}
                </h3>
                <p className="text-neutral-200 leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </StaggerReveal>
      </div>
    </section>
  );
}
