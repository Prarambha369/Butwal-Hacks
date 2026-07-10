import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { auth0 } from "@/lib/auth0";
import {Filter, Download, Search} from 'lucide-react';

export default async function MyMarkersPage() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;

  if (!userId) redirect('/sign-in');

  const supabase = await createClient();
  // ponytail: Resolve profile UUID for FK query
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth0_user_id', userId)
    .single();

  const { data: markers, error } = await supabase
    .from('trust_markers')
    .select('*, profiles(full_name)')
    .eq('issuer_id', profile?.id ?? 'none')
    .order('created_at', { ascending: false });

  if (error) return <div className="p-12 text-bh-red-500">Error loading markers: {error.message}</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Issued Markers</h1>
          <p className="text-secondary opacity-60">Track and manage the trust markers you have granted to the community.</p>
        </div>
        <div className="flex gap-3">
          <button className="p-2 rounded-xl bg-surface/10 border border-glass hover:bg-surface/10 transition-all text-secondary">
            <Download size={18} />
          </button>
          <button className="p-2 rounded-xl bg-surface/10 border border-glass hover:bg-surface/10 transition-all text-secondary">
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="lg-surface rounded-3xl overflow-hidden border border-glass">
        <div className="p-4 border-b border-glass bg-surface/10 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={16} />
            <input 
              type="text" 
              placeholder="Search markers by hacker or title..." 
              className="w-full bg-surface/10 border border-glass rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 ring-red-500/50 transition-all"
            />
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface/10 text-xs font-mono uppercase tracking-widest opacity-40 border-b border-glass">
              <th className="px-6 py-4 font-medium">Recipient</th>
              <th className="px-6 py-4 font-medium">Marker Title</th>
              <th className="px-6 py-4 font-medium text-center">Status</th>
              <th className="px-6 py-4 font-medium">Date Issued</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {markers && markers.length > 0 ? (
              markers.map((m) => (
                <tr key={m.id} className="hover:bg-surface/10 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-bold text-sm">{m.profiles?.full_name || 'Unknown Hacker'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm opacity-60">{m.title}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${m.is_revoked ? 'bg-bh-red-500/20 text-bh-red-500' : 'bg-green-500/20 text-green-400'}`}>
                      {m.is_revoked ? 'Revoked' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs opacity-40">
                    {new Date(m.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-secondary italic">
                  You haven&apos;t issued any trust markers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
