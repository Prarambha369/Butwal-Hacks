import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { AlertCircle, RefreshCcw } from 'lucide-react';


export default async function TrustOverridePage() {
  const supabase = await createClient();
  
  const { data: markers } = await supabase
    .from('trust_markers')
    .select('*, profiles(full_name, id)')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Trust Override</h1>
          <p className="text-secondary opacity-60">Manual adjustment of trust markers for exceptional cases.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="lg-surface p-6 rounded-3xl border border-glass space-y-4">
            <div className="flex items-center gap-3 text-bh-red-500">
              <AlertCircle size={20} />
              <h3 className="font-bold">Warning</h3>
            </div>
            <p className="text-xs text-secondary opacity-60 leading-relaxed">
              Overriding trust markers bypasses the standard verification pipeline. Every action here is recorded in the audit log.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="lg-surface rounded-3xl overflow-hidden border border-glass">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface/10 text-xs font-mono uppercase tracking-widest opacity-40 border-b border-glass">
                  <th className="px-6 py-4">Hacker</th>
                  <th className="px-6 py-4">Marker</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {markers && markers.length > 0 ? (
                  markers.map((m) => (
                    <tr key={m.id} className="hover:bg-surface/10 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-bold text-sm">{m.profiles?.full_name || 'Unknown'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm opacity-60">{m.title}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${m.is_revoked ? 'bg-bh-red-500/20 text-bh-red-500' : 'bg-green-500/20 text-green-400'}`}>
                          {m.is_revoked ? 'Revoked' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 rounded-lg hover:bg-surface/10 text-secondary transition-colors">
                          <RefreshCcw size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-secondary italic">
                      No trust markers available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
