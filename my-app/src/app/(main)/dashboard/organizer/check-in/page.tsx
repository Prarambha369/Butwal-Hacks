"use client";

import React, { useState, useEffect } from 'react';
import { ScanLine, Search, CheckCircle2, Users, Loader2, Calendar } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';

interface Event {
  id: string;
  title: string;
  start_date: string;
}

interface Profile {
  id: string;
  full_name: string | null;
  bh_id: string | null;
  avatar_url: string | null;
  email: string | null;
}

interface Registration {
  id: string;
  attended: boolean;
  profiles: Profile | null;
}

export default function CheckInPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (!res.ok) throw new Error('Failed to load events');
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedEventId) return;
    fetchRegistrations();
  }, [selectedEventId]);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${selectedEventId}/registrations`);
      if (!res.ok) throw new Error('Failed to load registrations');
      const data = await res.json();
      setRegistrations(data.registrations || []);
    } catch {
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (registrationId: string) => {
    setCheckingIn(registrationId);
    try {
      const res = await fetch('/api/events/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_id: registrationId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Check-in failed');
      }

      setRegistrations(prev =>
        prev.map(r =>
          r.id === registrationId ? { ...r, attended: !r.attended } : r
        )
      );
      toast.success('Check-in updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Check-in failed');
    } finally {
      setCheckingIn(null);
    }
  };

  const filteredRegistrations = registrations.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const p = r.profiles;
    return (
      p?.full_name?.toLowerCase().includes(q) ||
      p?.bh_id?.toLowerCase().includes(q) ||
      p?.email?.toLowerCase().includes(q)
    );
  });

  const attendedCount = registrations.filter(r => r.attended).length;
  const selectedEvent = events.find(e => e.id === selectedEventId);
  const startDate = selectedEvent
    ? new Date(selectedEvent.start_date).toLocaleDateString()
    : '';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Event Check-in</h1>
          <p className="text-secondary opacity-60">Scan BH-IDs or search to verify attendance.</p>
        </div>
      </div>

      {/* Event selector */}
      <div className="lg-surface p-6 rounded-3xl border border-glass space-y-4">
        <label className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
          <Calendar size={16} /> Select Event
        </label>
        <select
          value={selectedEventId}
          onChange={e => setSelectedEventId(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-surface/10 border border-glass focus:border-bh-red-500 outline-none transition-all text-primary"
        >
          <option value="">Choose an event...</option>
          {events.map(e => (
            <option key={e.id} value={e.id}>
              {e.title} — {new Date(e.start_date).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      {selectedEventId && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="lg-surface p-4 rounded-2xl border border-glass text-center">
              <p className="text-2xl font-bold">{registrations.length}</p>
              <p className="text-xs text-secondary opacity-60">Registered</p>
            </div>
            <div className="lg-surface p-4 rounded-2xl border border-glass text-center">
              <p className="text-2xl font-bold text-green-500">{attendedCount}</p>
              <p className="text-xs text-secondary opacity-60">Checked In</p>
            </div>
            <div className="lg-surface p-4 rounded-2xl border border-glass text-center">
              <p className="text-2xl font-bold">
                {registrations.length > 0
                  ? Math.round((attendedCount / registrations.length) * 100)
                  : 0}%
              </p>
              <p className="text-xs text-secondary opacity-60">Attendance Rate</p>
            </div>
          </div>

          {/* Search */}
          <div className="lg-surface p-6 rounded-3xl border border-glass space-y-4">
            <div className="flex items-center gap-3 text-bh-red-500">
              <ScanLine size={24} />
              <h3 className="text-xl font-bold">{selectedEvent?.title}</h3>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
              <input
                type="text"
                placeholder="Search by name, BH-ID, or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface/10 border border-glass focus:border-bh-red-500 outline-none transition-all font-mono"
              />
            </div>

            {/* Attendee list */}
            <div className="space-y-2">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-secondary" />
                </div>
              ) : filteredRegistrations.length > 0 ? (
                filteredRegistrations.map(r => {
                  const p = r.profiles;
                  return (
                    <div
                      key={r.id}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        r.attended
                          ? 'bg-green-500/5 border-green-500/30'
                          : 'bg-surface/10 border-glass'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-surface/10">
                          <Image
                            src={p?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p?.full_name}`}
                            alt={p?.full_name || 'Hacker'}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-primary">{p?.full_name || 'Unknown'}</p>
                          <p className="text-xs font-mono text-secondary">{p?.bh_id || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {r.attended && (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        )}
                        <button
                          onClick={() => handleCheckIn(r.id)}
                          disabled={checkingIn === r.id}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${
                            r.attended
                              ? 'bg-surface/10 text-secondary hover:bg-red-500/10 hover:text-red-500'
                              : 'bg-bh-red-500 text-white hover:bg-bh-red-600'
                          }`}
                        >
                          {checkingIn === r.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : r.attended ? (
                            'Undo'
                          ) : (
                            'Check In'
                          )}
                        </button>
                        <Link
                          href={`/profile/${p?.bh_id}`}
                          className="p-2 rounded-lg hover:bg-surface/10 text-secondary hover:text-primary transition-all"
                        >
                          <Users className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-secondary italic">
                  {searchQuery
                    ? 'No matching registrations found.'
                    : 'No registrations for this event yet.'}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {!selectedEventId && !loading && (
        <div className="lg-surface p-12 rounded-3xl border border-glass text-center space-y-4">
          <ScanLine size={48} className="mx-auto opacity-20" />
          <p className="text-secondary opacity-60">Select an event above to start checking in participants.</p>
        </div>
      )}
    </div>
  );
}
