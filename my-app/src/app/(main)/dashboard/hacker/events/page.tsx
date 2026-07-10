import React from 'react';
import { redirect } from 'next/navigation';
import { auth0 } from "@/lib/auth0";
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Calendar, MapPin, Users, CheckCircle2, Code2 } from 'lucide-react';
import { RegisterEventButton } from './register-button';

export default async function HackerEventsPage() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;
  if (!userId) redirect('/sign-in');

  const supabase = await createClient();

  // ponytail: Look up profile UUID for profile_id FK
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth0_user_id', userId)
    .single();

  // Fetch published upcoming events
  const { data: upcomingEvents } = await supabase
    .from('events')
    .select('id, title, description, start_date, end_date, location, banner_url')
    .eq('is_published', true)
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true });

  // Fetch user's registered events if profile exists
  let registeredEventIds: string[] = [];
  let registeredEvents: any[] = [];
  if (profile) {
    const { data: registrations } = await supabase
      .from('event_registrations')
      .select('event_id')
      .eq('profile_id', profile.id);

    registeredEventIds = registrations?.map(r => r.event_id) || [];

    if (registeredEventIds.length > 0) {
      const { data: regEvents } = await supabase
        .from('events')
        .select('*')
        .in('id', registeredEventIds)
        .order('start_date', { ascending: false });

      registeredEvents = regEvents || [];
    }
  }

  const isRegistered = (eventId: string) => registeredEventIds.includes(eventId);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-secondary opacity-60">Discover and register for upcoming hackathons and workshops.</p>
        </div>
      </div>

      {/* Registered Events */}
      {registeredEvents.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
            <CheckCircle2 size={16} /> Your Registered Events
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {registeredEvents.map((event) => (
              <EventCard key={event.id} event={event} registered={true} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
          <Calendar size={16} /> Upcoming Events
        </h2>
        {upcomingEvents && upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                registered={isRegistered(event.id)}
                profileId={profile?.id}
              />
            ))}
          </div>
        ) : (
          <div className="lg-surface rounded-3xl p-12 text-center border border-glass space-y-4">
            <Calendar size={48} className="mx-auto opacity-20" />
            <p className="text-secondary opacity-60">No upcoming events right now.</p>
            <p className="text-xs text-secondary opacity-40">Check back soon for new hackathons and workshops.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({
  event,
  registered,
  profileId,
}: {
  event: any;
  registered: boolean;
  profileId?: string;
}) {
  const startDate = new Date(event.start_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="lg-surface rounded-3xl p-6 border border-glass space-y-4 hover:border-bh-red-500/30 transition-all group">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-bh-red-500/10 text-bh-red-500">
            <Calendar size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold group-hover:text-bh-red-500 transition-colors">
              {event.title}
            </h3>
            <p className="text-xs font-mono text-secondary">{startDate}</p>
          </div>
        </div>
      </div>

      <p className="text-sm text-secondary opacity-60 line-clamp-2">
        {event.description}
      </p>

      <div className="flex items-center gap-4 text-xs font-mono opacity-40">
        {event.location && (
          <span className="flex items-center gap-1">
            <MapPin size={12} /> {event.location}
          </span>
        )}
      </div>

      {registered ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 text-green-500 text-xs font-bold">
            <CheckCircle2 size={14} /> Registered
          </div>
          <Link
            href={`/dashboard/projects/new`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-bh-red-500 text-white text-xs font-bold hover:bg-bh-red-600 transition-all"
          >
            <Code2 size={14} /> Submit Project
          </Link>
        </div>
      ) : (
        profileId && <RegisterEventButton eventId={event.id} />
      )}
    </div>
  );
}
