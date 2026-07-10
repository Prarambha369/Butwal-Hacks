import React from 'react';


import TeamManagement from '@/components/dashboard/team-management';

export default function TeamDashboardPage() {
  return (
    <div className="min-h-screen bg-background text-primary pt-24 pb-20 px-4">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight font-heading">
            My <span className="text-bh-red-500">Team</span>
          </h1>
          <p className="text-xl text-secondary">
            Manage your squad, coordinate roles, and track your project progress.
          </p>
        </div>
        
        <TeamManagement />
      </div>
    </div>
  );
}
