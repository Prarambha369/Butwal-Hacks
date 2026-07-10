"use client";

import React from 'react';
import { CldImage } from 'next-cloudinary';
import { FadeIn } from '@/components/home/shared-primitives';

const testimonials = [
  {
    text: "Butwal Hacks changed how I think about building. It's not just about the code, but about the community and the impact we can create together in our own city.",
    author: "Suman KC",
    role: "Full Stack Developer",
    avatar: "suman_avatar",
  },
  {
    text: "The mentorship here is unparalleled. Having access to experienced builders who actually care about regional growth made all the difference in my learning journey.",
    author: "Anjali Sharma",
    role: "UI/UX Designer",
    avatar: "anjali_avatar",
  },
  {
    text: "Shipping a real product in 48 hours was intense, but the support system at Butwal Hacks made it possible. I'm now contributing to open source projects daily.",
    author: "Rohit Thapa",
    role: "Backend Engineer",
    avatar: "rohit_avatar",
  },
];

export default function Testimonials() {
  return (
    <section className="w-full bg-bg py-24 md:py-32">
      <FadeIn>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black text-neutral-50 mb-6">
              What Our Community Says
            </h2>
            <p className="text-neutral-300 max-w-2xl mx-auto text-lg">
              Stories of growth, innovation, and impact from the builders of Butwal.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((t, index) => (
              <div 
                key={index} 
                className="group p-8 rounded-2xl bg-neutral-600 border border-neutral-500 transition-all duration-300 hover:-translate-y-2 hover:border-red-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
              >
                <div className="mb-6 text-red-300">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14.017 21L14.017 18C14.017 16.8954 13.1216 16 12.017 16C10.9124 16 10.017 16.8954 10.017 18L10.017 21H4V13C4 11.8954 4.89543 11 6 11H8V7C8 5.89543 8.89543 5 10 5C11.1046 5 12 5.89543 12 7V11H14C15.1046 11 16 11.8954 16 13V21H14.017Z" />
                  </svg>
                </div>
                <p className="text-neutral-200 italic text-lg leading-relaxed mb-8">
                  &quot;{t.text}&quot;
                </p>
                <div className="flex items-center gap-4">
                  <CldImage
                    width="48"
                    height="48"
                    src={t.avatar}
                    alt={t.author}
                    crop="fill"
                    className="rounded-full grayscale group-hover:grayscale-0 transition-all"
                  />
                  <div>
                    <p className="text-neutral-50 font-bold">{t.author}</p>
                    <p className="text-neutral-400 text-sm">{t.role}</p>
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
