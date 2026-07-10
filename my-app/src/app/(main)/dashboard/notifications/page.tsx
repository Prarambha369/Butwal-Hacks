import { Check, Info, AlertCircle } from 'lucide-react';
import { getRecentActivity } from '@/lib/actions/activity';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const activities = await getRecentActivity();

  return (
    <div className="p-6 md:p-12 space-y-12">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-bh-red-500">Activity</span>
          <h1 className="text-4xl font-bold tracking-tight">Notifications</h1>
        </div>
        <button className="text-xs font-bold text-bh-red-500 hover:underline">Mark all as read</button>
      </div>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="lg-surface rounded-3xl p-12 text-center border border-glass">
            <p className="text-secondary opacity-60 font-mono text-sm">
              No recent activity to display. Start building to see updates!
            </p>
          </div>
        ) : (
          activities.map((n) => (
            <div key={n.id} className="lg-surface p-6 rounded-3xl border border-glass transition-all hover:translate-x-2 bg-surface/10">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl ${n.type === 'XP_AWARDED' ? 'bg-status-green/10 text-status-green' : n.type === 'TEAM_JOINED' ? 'bg-status-yellow/10 text-status-yellow' : 'bg-status-blue/10 text-status-blue'}`}>
                  {n.type === 'XP_AWARDED' ? <Check size={20} /> : n.type === 'TEAM_JOINED' ? <AlertCircle size={20} /> : <Info size={20} />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-lg">
                      {n.user?.full_name || 'A hacker'} {n.message}
                    </h4>
                    <span className="text-[10px] font-mono opacity-40">
                      {new Date(n.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-secondary opacity-70">
                    Activity recorded in the global trust network.
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
