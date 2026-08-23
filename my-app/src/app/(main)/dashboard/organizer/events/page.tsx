import { createClient } from '@/utils/supabase';
import { redirect } from 'next/navigation';
import { auth0 } from "@/lib/auth0";
import Link from 'next/link';
import { Calendar, Plus, Users, BarChart3 } from 'lucide-react';


export default async function OrganizerEventsPage() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;

  if (!userId) redirect('/sign-in');

  const supabase = await createClient();
  // ponytail: Look up profile UUID to satisfy organizer_id FK (UUID, not Auth0 sub)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth0_user_id', userId)
    .single();

  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('organizer_id', profile?.id ?? 'none')
    .order('start_date', { ascending: false });

  if (error) {
    return <div className="p-12 text-primary-red">Error loading events: {error.message}</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-primary">My Events</h1>
          <p className="text-sm text-muted-foreground">Manage your event lifecycle and participant engagement.</p>
        </div>
        <Link href="/dashboard/organizer/events/new" className="inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-deep-red">
          <Plus size={16} /> Create New Event
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events && events.length > 0 ? (
          events.map((event) => (
            <div key={event.id} className="bh-card p-6 space-y-6 hover:border-primary-red/30 transition-all group">
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-lg bg-primary-red/10 text-primary-red">
                  <Calendar size={20} />
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${event.is_published ? 'bg-primary-red/10 text-primary-red border border-primary-red/20' : 'bg-surface-hover text-muted-foreground border border-border'}`}>
                  {event.is_published ? 'Published' : 'Draft'}
                </span>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold group-hover:text-primary-red transition-colors">{event.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {event.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <Calendar size={12} />
                  {event.start_date}
                </div>
                <div className="flex gap-2">
                  <a href={`/dashboard/organizer/events/${event.id}/analytics`} className="p-2 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-primary transition-colors" title="Analytics">
                    <BarChart3 size={16} />
                  </a>
                  <a href={`/dashboard/organizer/events/${event.id}/attendees`} className="p-2 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-primary transition-colors" title="Attendees">
                    <Users size={16} />
                  </a>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bh-card p-12 text-center space-y-4">
            <Calendar size={48} className="mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">You haven&apos;t created any events yet.</p>
            <Link href="/dashboard/organizer/events/new" className="text-sm font-bold text-primary-red hover:underline">Start your first event →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
