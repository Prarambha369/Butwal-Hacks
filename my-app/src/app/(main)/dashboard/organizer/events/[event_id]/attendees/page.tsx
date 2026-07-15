import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { Users, ExternalLink, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import AttendeeExport, { type Attendee } from "@/components/dashboard/organizer/attendee-export";
import { CheckInButton } from "./checkin-button";

type Props = {
  params: Promise<{ event_id: string }>;
};

interface RegistrationWithProfile {
  id: string;
  attended: boolean;
  profiles: {
    id: string;
    full_name: string | null;
    bh_id: string | null;
    role: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

export default async function AttendeesPage({ params }: Props) {
  const { event_id } = await params;
  const session = await auth0.getSession();
  const userId = session?.user?.sub;

  if (!userId) redirect("/sign-in");

  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", event_id)
    .single();

  if (!event) notFound();

  // ponytail: Use Supabase join syntax to get registration data + profile info
  const { data: registrations } = await supabase
    .from("event_registrations")
    .select(`
      id,
      attended,
      profiles!inner(id, full_name, bh_id, role, email, avatar_url)
    `)
    .eq("event_id", event_id);

  const rows: RegistrationWithProfile[] = (registrations || []) as unknown as RegistrationWithProfile[];
  const attendees: Attendee[] = rows.map(r => ({
    full_name: r.profiles?.full_name,
    bh_id: r.profiles?.bh_id,
    role: r.profiles?.role,
    email: r.profiles?.email,
    avatar_url: r.profiles?.avatar_url,
  }));
  const attendedCount = rows.filter(r => r.attended).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/organizer" className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mb-2">
            ← Back to Hub
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            {event.title}
          </h1>
          <p className="text-sm text-muted-foreground">Manage your registered hackers</p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bh-card p-4 text-center">
          <p className="text-2xl font-bold text-primary">{rows.length}</p>
          <p className="text-xs text-muted-foreground">Registered</p>
        </div>
        <div className="bh-card p-4 text-center">
          <p className="text-2xl font-bold text-status-green">{attendedCount}</p>
          <p className="text-xs text-muted-foreground">Checked In</p>
        </div>
        <div className="bh-card p-4 text-center flex items-center justify-center gap-2">
          <AttendeeExport attendees={attendees} eventName={event.title} />
        </div>
      </div>

      <div className="bh-card overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="text-base font-bold flex items-center gap-2 text-primary">
            <Users className="w-5 h-5 text-muted-foreground" /> Attendees ({rows.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border">
                <th className="px-6 py-4">Hacker</th>
                <th className="px-6 py-4">BH-ID</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row) => {
                  const p = row.profiles;
                  return (
                    <tr key={row.id} className="border-b border-border last:border-b-0 hover:bg-surface-hover transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-8 h-8 overflow-hidden rounded-full bg-surface-hover border border-border">
                            <Image 
                              src={p?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p?.full_name}`} 
                              alt={p?.full_name || 'Hacker'}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <span className="text-sm font-semibold text-primary">{p?.full_name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{p?.bh_id || 'N/A'}</td>
                      <td className="px-6 py-4">
                        {row.attended ? (
                          <span className="flex items-center gap-1 text-status-green text-xs font-bold">
                            <CheckCircle2 size={14} /> Checked In
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not checked in</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <CheckInButton
                            registrationId={row.id}
                            attended={row.attended}
                          />
                          <Link 
                            href={`/profile/${p?.bh_id}`}
                            className="p-2 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-primary transition-all"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    No registrations yet for this event.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
