import React from 'react';
import { createClient } from '@/utils/supabase/server';
import {Filter, Download, Search} from 'lucide-react';

export default async function AuditLogPage() {
  const supabase = await createClient();
  
  const { data: logs, error } = await supabase
    .from('audit_logs')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return <div className="p-12 text-bh-red-500">Error loading audit logs: {error.message}</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">System Audit Log</h1>
          <p className="text-secondary opacity-60">Immutable record of all critical administrative and system actions.</p>
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
              placeholder="Search logs by actor, action or target..." 
              className="w-full bg-surface/10 border border-glass rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 ring-red-500/50 transition-all"
            />
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface/10 text-xs font-mono uppercase tracking-widest opacity-40 border-b border-glass">
              <th className="px-6 py-4 font-medium">Timestamp</th>
              <th className="px-6 py-4 font-medium">Actor</th>
              <th className="px-6 py-4 font-medium">Action</th>
              <th className="px-6 py-4 font-medium">Target</th>
              <th className="px-6 py-4 font-medium">Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {logs && logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-surface/10 transition-colors group">
                  <td className="px-6 py-4 font-mono text-[10px] opacity-50">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-sm">{log.profiles?.full_name || 'System'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded-full bg-surface/10 border border-glass text-[10px] font-bold uppercase">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs opacity-60">
                    {log.target_id}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[10px] font-mono opacity-40 max-w-xs truncate group-hover:opacity-100 transition-opacity">
                      {JSON.stringify(log.metadata)}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-secondary italic">
                  No audit logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
