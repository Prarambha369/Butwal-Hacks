import React from 'react';
import { CldImage } from 'next-cloudinary';
import { FadeIn } from '@/components/home/shared-primitives';

const partners = [
  { name: 'Zapier', logo: 'zapier_logo' },
  { name: 'Spotify', logo: 'spotify_logo' },
  { name: 'Zoom', logo: 'zoom_logo' },
  { name: 'Slack', logo: 'slack_logo' },
  { name: 'Amazon', logo: 'amazon_logo' },
  { name: 'Adobe', logo: 'adobe_logo' },
];

export default function PartnersGrid() {
  return (
    <section className="w-full bg-bg py-20" aria-label="Partner Institutions">
      <FadeIn>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-neutral-300 text-sm font-bold uppercase tracking-[0.2em]">
              Trusted By Our Partner Institutions
            </h2>
          </div>
          
          <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6 items-center justify-center">
            {partners.map((partner) => (
              <div 
                key={partner.name} 
                className="flex items-center justify-center p-4 transition-all duration-300 group"
              >
                <CldImage
                  width="120"
                  height="40"
                  src={partner.logo}
                  alt={`${partner.name} logo`}
                  crop="pad"
                  className="h-8 w-auto object-contain filter grayscale opacity-50 transition-all duration-300 group-hover:grayscale-0 group-hover:opacity-100"
                />
              </div>
            ))}
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
