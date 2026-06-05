import React from 'react';
import TopNav from '@/components/top-nav';
import BottomNav from '@/components/bottom-nav';
import Hero from '@/components/hero';
import StatsBar from '@/components/stats-bar';
import ProgramsGrid from '@/components/programs-grid';
import CommunityBento from '@/components/community-bento';

export default function Home() {
  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex flex-col relative">
        <TopNav />
        
        <main className="flex-1 relative pt-20 pb-24">
          <Hero />
          <StatsBar />
          
          <div className="space-y-24 pb-24">
            <ProgramsGrid />
            <CommunityBento />
          </div>
          
          <div className="h-screen w-full bg-gradient-to-b from-red-500/5 to-transparent rounded-t-[40px] border-t border-white/5 flex items-center justify-center">
             <p className="text-text-secondary font-mono text-sm italic">
               Building the home of Nepal's makers...
             </p>
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
