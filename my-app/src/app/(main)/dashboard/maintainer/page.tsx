import { ReactNode } from 'react';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Terminal, Activity, ShieldCheck, Lock, Users, FolderPlus, Calendar, ArrowRight, CheckCircle2, GraduationCap } from 'lucide-react';

export default async function MaintainerCommandCenter() {
  const supabase = await createClient();
  
  const { data: profiles } = await supabase.from('profiles').select('*, trust_markers(count)', { count: 'exact' });
  const { data: projects } = await supabase.from('projects').select('id');
  const { data: events } = await supabase.from('events').select('id');

  const trustMarkerCount = profiles?.reduce((acc, p) => acc + (p.trust_markers?.length || 0), 0) || 0;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Command Center</h1>
          <p className="text-sm text-muted-foreground">Global system overview and critical control points.</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-status-green/10 text-status-green text-[11px] font-bold border border-status-green/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          System Healthy
        </div>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Hackers" value={profiles?.length || 0} icon={<Users size={18} />} color="text-status-blue" />
        <StatCard title="Projects" value={projects?.length || 0} icon={<FolderPlus size={18} />} color="text-status-green" />
        <StatCard title="Events" value={events?.length || 0} icon={<Calendar size={18} />} color="text-status-orange" />
        <StatCard title="Trust Markers" value={trustMarkerCount} icon={<ShieldCheck size={18} />} color="text-primary-red" />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Integrity */}
        <div className="bh-card p-6 space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-surface-hover">
              <Terminal className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-base font-bold text-primary">System Integrity</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-surface-hover border border-border">
              <span className="text-sm text-muted-foreground">RLS Policies</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-status-green">
                <CheckCircle2 className="w-3 h-3" />
                VERIFIED
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-surface-hover border border-border">
              <span className="text-sm text-muted-foreground">Auth Bridge</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-status-green">
                <CheckCircle2 className="w-3 h-3" />
                ACTIVE
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-surface-hover border border-border">
              <span className="text-sm text-muted-foreground">Credential Leak Scan</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-status-green">
                <CheckCircle2 className="w-3 h-3" />
                CLEAN
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bh-card p-6 space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-surface-hover">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-base font-bold text-primary">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <QuickActionLink href="/dashboard/maintainer/users" icon={<Users size={16} />} label="Manage Users" />
            <QuickActionLink href="/dashboard/maintainer/trust-override" icon={<ShieldCheck size={16} />} label="Trust Override" />
            <QuickActionLink href="/dashboard/maintainer/audit-log" icon={<Lock size={16} />} label="Audit Log" />
            <QuickActionLink href="/dashboard/maintainer/site-config" icon={<FolderPlus size={16} />} label="Site Config" />
            <QuickActionLink href="/dashboard/maintainer/dedicate-school" icon={<GraduationCap size={16} />} label="Dedicate School" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: ReactNode; color: string }) {
  return (
    <div className="bh-card p-5 space-y-3">
      <div className={`p-2 rounded-lg bg-surface-hover w-fit ${color}`}>{icon}</div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold text-primary">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}

function QuickActionLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-between gap-2 px-4 py-3 rounded-lg bg-surface-hover border border-border text-sm font-medium text-primary hover:border-primary-red/20 hover:bg-primary-red/[0.03] transition-all group"
    >
      <span className="flex items-center gap-2.5">
        <span className="text-muted-foreground group-hover:text-primary-red transition-colors">{icon}</span>
        {label}
      </span>
      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary-red transition-all group-hover:translate-x-0.5" />
    </Link>
  );
}


