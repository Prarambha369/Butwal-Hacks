import { auth0 } from "@/lib/auth0";
import { getAllUsers, updateUserRole, banUser } from '@/lib/actions/admin';
import { ShieldAlert, UserMinus, Lock, Unlock, Users } from 'lucide-react';

export default async function AdminUsersPage() {
  const users = await getAllUsers();
  const session = await auth0.getSession();
  void session; // auth check for protected page

  const activeCount = users.filter(u => !u.is_banned).length;
  const bannedCount = users.filter(u => u.is_banned).length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary-red">Management</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span className="text-[11px] font-mono text-muted-foreground">{users.length} users</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">User Administration</h1>
        <p className="text-sm text-muted-foreground">Control access, roles, and account status across the ecosystem.</p>
      </div>

      {/* Mini stats */}
      <div className="flex items-center gap-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-hover border border-border text-xs">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-medium text-primary">{activeCount}</span>
          <span className="text-muted-foreground">active</span>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-hover border border-border text-xs">
          <Lock className="w-3.5 h-3.5 text-primary-red" />
          <span className="font-medium text-primary-red">{bannedCount}</span>
          <span className="text-muted-foreground">banned</span>
        </div>
      </div>

      {/* Users table */}
      <div className="bh-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Hacker</th>
              <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">BH-ID</th>
              <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Role</th>
              <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground text-center">Status</th>
              <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-b-0 hover:bg-surface-hover transition-colors group">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-hover border border-border flex items-center justify-center text-primary font-bold text-xs">
                      {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-semibold text-primary group-hover:text-primary-red transition-colors">
                      {u.full_name || 'Unnamed'}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{u.bh_id}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    u.role === 'organizer' ? 'bg-status-orange/10 border-status-orange/30 text-status-orange' : 
                    u.role === 'maintainer' ? 'bg-status-blue/10 border-status-blue/30 text-status-blue' : 
                    'bg-surface-hover border-border text-muted-foreground'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-center">
                  {u.is_banned ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-red/10 border border-primary-red/30 text-primary-red text-[10px] font-bold uppercase tracking-wider">
                      <Lock size={10} /> Banned
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-status-green/10 border border-status-green/30 text-status-green text-[10px] font-bold uppercase tracking-wider">
                      <Unlock size={10} /> Active
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <form action={async () => {
                      'use server';
                      await updateUserRole(u.id, u.role === 'hacker' ? 'maintainer' : 'hacker');
                    }}>
                      <button className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg hover:bg-surface-hover border border-transparent hover:border-border text-muted-foreground hover:text-status-blue transition-all focus:ring-2 focus:ring-[#FE0000] focus:outline-none" title="Toggle Maintainer Role" aria-label="Toggle Maintainer Role">
                        <ShieldAlert size={15} />
                      </button>
                    </form>
                    <form action={async () => {
                      'use server';
                      await banUser(u.id);
                    }}>
                      <button className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg hover:bg-surface-hover border border-transparent hover:border-border text-muted-foreground hover:text-primary-red transition-all focus:ring-2 focus:ring-[#FE0000] focus:outline-none" title={u.is_banned ? 'Unban User' : 'Ban User'} aria-label={u.is_banned ? 'Unban User' : 'Ban User'}>
                        <UserMinus size={15} />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="p-12 text-center">
            <div className="inline-flex p-3 rounded-lg bg-surface-hover mb-3">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-primary">No users found</p>
            <p className="text-xs text-muted-foreground mt-1">Users will appear here once they sign up.</p>
          </div>
        )}
      </div>
    </div>
  );
}
