import React from 'react';
import SiteHeader from '@/components/site-header';
import Footer from '@/components/sections/Footer';
import GrowthCharts from '@/components/dashboard/organizer/growth-charts';
import { getCommunityGrowthData, getParticipationMetrics } from '@/lib/actions/analytics-admin';
import { TrendingUp, Users, FolderPlus, Calendar } from 'lucide-react';

export default async function OrganizerAnalyticsPage() {
  const growthData = await getCommunityGrowthData();
  const metrics = await getParticipationMetrics();

  return (
    <div className="min-h-screen bg-background text-primary pt-24 pb-20 px-4">
      <SiteHeader />
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-bh-red-500 text-xs font-bold uppercase tracking-widest">
            <TrendingUp size={14} />
            Growth Intelligence
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight font-heading">
            Community <span className="text-bh-red-500">Analytics</span>
          </h1>
        </div>

        {/* High-level Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-surface/10 border border-glass flex items-center gap-6">
            <div className="w-14 h-14 bg-status-blue/20 rounded-2xl flex items-center justify-center text-status-blue">
              <Users size={28} />
            </div>
            <div>
              <div className="text-3xl font-bold">{metrics.totalUsers.toLocaleString()}</div>
              <div className="text-xs text-secondary uppercase tracking-wider font-medium">Total Hackers</div>
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-surface/10 border border-glass flex items-center gap-6">
            <div className="w-14 h-14 bg-status-green/20 rounded-2xl flex items-center justify-center text-status-green">
              <FolderPlus size={28} />
            </div>
            <div>
              <div className="text-3xl font-bold">{metrics.totalProjects.toLocaleString()}</div>
              <div className="text-xs text-secondary uppercase tracking-wider font-medium">Projects Built</div>
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-surface/10 border border-glass flex items-center gap-6">
            <div className="w-14 h-14 bg-status-orange/20 rounded-2xl flex items-center justify-center text-status-orange">
              <Calendar size={28} />
            </div>
            <div>
              <div className="text-3xl font-bold">{metrics.totalEvents.toLocaleString()}</div>
              <div className="text-xs text-secondary uppercase tracking-wider font-medium">Events Hosted</div>
            </div>
          </div>
        </div>

        {/* Detailed Growth Charts */}
        <GrowthCharts data={growthData} />
      </div>
      <Footer />
    </div>
  );
}
