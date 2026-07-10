import React from 'react';
import { redirect } from 'next/navigation';
import { auth0 } from "@/lib/auth0";

import HackerDiscovery from '@/components/dashboard/hacker-discovery';

export default async function HackerTeammatesPage() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;

  if (!userId) redirect('/sign-in');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Find Teammates</h1>
          <p className="text-secondary opacity-60">Collaborate with other hackers to build something amazing.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="lg-surface p-6 rounded-3xl border border-glass space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-40">Filters</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs opacity-60">Skillset</label>
                <select className="w-full bg-surface/10 border border-glass rounded-xl px-3 py-2 text-xs outline-none">
                  <option>All Skills</option>
                  <option>Frontend</option>
                  <option>Backend</option>
                  <option>UI/UX</option>
                  <option>AI/ML</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs opacity-60">Role</label>
                <select className="w-full bg-surface/10 border border-glass rounded-xl px-3 py-2 text-xs outline-none">
                  <option>All Roles</option>
                  <option>Hacker</option>
                  <option>Designer</option>
                  <option>Project Manager</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-3">
          <HackerDiscovery />
        </div>
      </div>
    </div>
  );
}
