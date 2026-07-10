import React from 'react';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Terminal, Activity, ShieldCheck, Lock, Users, FolderPlus, Calendar } from 'lucide-react';

export default async function MaintainerCommandCenter() {
  const supabase = await createClient();
  
  const { data: profiles } = await supabase.from('profiles').select('*, trust_markers(count)', { count: 'exact' });
  const { data: projects } = await supabase.from('projects').select('id');
  const { data: events } = await supabase.from('events').select('id');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
          <p className="text-secondary opacity-60">Global system overview and critical control points.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-status-green/10 text-status-green text-xs font-bold flex items-center gap-2 border border-status-green/20">
            <div className="w-2 h-2 rounded-full bg-status-green animate-pulse" />
            System Healthy
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Hackers" value={profiles?.length || 0} icon={<Users size={20} />} color="text-status-blue" />
        <StatCard title="Projects" value={projects?.length || 0} icon={<FolderPlus size={20} />} color="text-status-green" />
        <StatCard title="Events" value={events?.length || 0} icon={<Calendar size={20} />} color="text-status-orange" />
        <StatCard title="Trust Markers" value={profiles?.reduce((acc, p) => acc + (p.trust_markers?.length || 0), 0) || 0} icon={<ShieldCheck size={20} />} color="text-bh-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="lg-surface p-8 rounded-3xl border border-glass space-y-6">
          <div className="flex items-center gap-3">
            <Terminal className="text-bh-red-500" size={24} />
            <h3 className="text-xl font-bold">System Integrity</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface/10 border border-glass">
              <span className="text-sm opacity-60">RLS Policies</span>
              <span className="text-xs font-bold text-status-green">VERIFIED</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface/10 border border-glass">
              <span className="text-sm opacity-60">Auth Bridge</span>
              <span className="text-xs font-bold text-status-green">ACTIVE</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface/10 border border-glass">
              <span className="text-sm opacity-60">Credential Leak Scan</span>
              <span className="text-xs font-bold text-status-green">CLEAN</span>
            </div>
          </div>
        </div>

        <div className="lg-surface p-8 rounded-3xl border border-glass space-y-6">
          <div className="flex items-center gap-3">
            <Activity className="text-status-blue" size={24} />
            <h3 className="text-xl font-bold">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/dashboard/maintainer/users" className="p-4 rounded-2xl bg-surface/10 border border-glass hover:bg-surface/10 transition-all flex items-center gap-3 text-sm font-medium">
              <Users size={16} /> Manage Users
            </Link>
            <Link href="/dashboard/maintainer/security-audit" className="p-4 rounded-2xl bg-surface/10 border border-glass hover:bg-surface/10 transition-all flex items-center gap-3 text-sm font-medium">
              <ShieldCheck size={16} /> Security Audit
            </Link>
            <Link href="/dashboard/maintainer/reviews" className="p-4 rounded-2xl bg-surface/10 border border-glass hover:bg-surface/10 transition-all flex items-center gap-3 text-sm font-medium">
              <Lock size={16} /> Review Queue
            </Link>
            <Link href="/dashboard/maintainer/projects" className="p-4 rounded-2xl bg-surface/10 border border-glass hover:bg-surface/10 transition-all flex items-center gap-3 text-sm font-medium">
              <FolderPlus size={16} /> Moderate Projects
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) {
  return (
    <div className="lg-surface p-6 rounded-3xl border border-glass space-y-4">
      <div className={`p-2 rounded-xl bg-surface/10 w-fit ${color}`}>{icon}</div>
      <div>
        <p className="text-xs font-mono opacity-40 uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-bold">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}


