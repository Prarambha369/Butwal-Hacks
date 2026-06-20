import { ReactNode } from 'react';
import { auth0 } from "@/lib/auth0";
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Calendar, Users, Rocket, Trophy, LayoutDashboard } from 'lucide-react';
import { SectionHeading } from '@/components/ui/section-heading';

export default async function OrganizerOverviewPage() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;
  
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth0_user_id', userId)
    .single();

  const profileId = profile?.id;

  const { data: events } = await supabase
    .from('events')
    .select('id')
    .eq('organizer_id', profileId ?? 'none');

  const { data: registrations } = await supabase
    .from('event_registrations')
    .select('id')
    .eq('organizer_id', profileId ?? 'none');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Organizer Overview</h1>
          <p className="text-sm text-muted-foreground">Manage your events and track participant growth.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(160px,auto)]">
        <StatCard 
          title="My Events" 
          value={events?.length || 0} 
          icon={<Calendar className="text-status-blue" />} 
          description="Active and past events" 
          variant="hero"
        />
        <StatCard 
          title="Total Registrants" 
          value={registrations?.length || 0} 
          icon={<Users className="text-status-green" />} 
          description="Total people signed up" 
        />
        <StatCard 
          title="Event Impact" 
          value="High" 
          icon={<Rocket className="text-status-orange" />} 
          description="Current reach score" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bh-card p-8 space-y-6">
          <SectionHeading variant="icon" icon={<LayoutDashboard size={20} />} as="h3">
            Quick Management
          </SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/dashboard/organizer/events/new" className="p-4 rounded-lg bg-surface-hover border border-border hover:border-primary-red/20 transition-all flex items-center gap-3 text-sm font-medium text-primary">
              <Trophy size={16} /> Create Event
            </Link>
            <Link href="/teams" className="p-4 rounded-lg bg-surface-hover border border-border hover:border-primary-red/20 transition-all flex items-center gap-3 text-sm font-medium text-primary">
              <Users size={16} /> Teams
            </Link>
            <Link href="/dashboard/organizer/events/new" className="p-4 rounded-lg bg-surface-hover border border-border hover:border-primary-red/20 transition-all flex items-center gap-3 text-sm font-medium text-primary">
              <Rocket size={16} /> Quick Event
            </Link>
            <Link href="/dashboard/organizer/events" className="p-4 rounded-lg bg-surface-hover border border-border hover:border-primary-red/20 transition-all flex items-center gap-3 text-sm font-medium text-primary">
              <Calendar size={16} /> All Events
            </Link>
          </div>
        </div>

        <div className="bh-card p-8 space-y-6">
          <SectionHeading variant="icon" icon={<Trophy size={20} />} color="yellow" as="h3">
            Organizer Status
          </SectionHeading>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-surface-hover border border-border">
              <span className="text-sm text-muted-foreground">Account Tier</span>
              <span className="text-xs font-bold text-status-yellow uppercase">Verified Organizer</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-surface-hover border border-border">
              <span className="text-sm text-muted-foreground">Trust Level</span>
              <span className="text-xs font-bold text-status-green uppercase">High</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, description, variant }: { title: string, value: string | number, icon: ReactNode, description: string, variant?: 'hero' | 'compact' }) {
  const isHero = variant === 'hero';
  return (
    <div className={`bh-card ${isHero ? 'md:col-span-2 md:row-span-2 p-8' : 'p-6'} space-y-${isHero ? '4' : '3'} ${isHero ? 'md:flex md:flex-col md:justify-center' : ''}`}>
      <div className="flex items-center justify-between">
        <div className={`p-2 ${isHero ? 'p-3' : ''} rounded-lg bg-surface-hover`}>{icon}</div>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className={`font-bold text-primary ${isHero ? 'text-5xl' : 'text-3xl'}`}>{value}</p>
      </div>
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">{description}</p>
    </div>
  );
}
