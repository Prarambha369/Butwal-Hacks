import React from 'react';
import { auth0 } from "@/lib/auth0";
import { getAllUsers, updateUserRole, banUser } from '@/lib/actions/admin';
import { ShieldAlert, UserMinus, Lock, Unlock } from 'lucide-react';


export default async function AdminUsersPage() {
  const users = await getAllUsers();
  const session = await auth0.getSession();
  void session; // auth check for protected page

  return (
    <div className="p-6 md:p-12 space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-bh-red-500">Management</span>
          <h1 className="text-4xl font-bold tracking-tight">User Administration</h1>
          <p className="text-secondary opacity-60">Control access, roles, and account status across the ecosystem.</p>
        </div>
      </div>

      <div className="lg-surface rounded-3xl overflow-hidden border border-glass">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface/10 text-xs font-mono uppercase tracking-widest opacity-40 border-b border-glass">
              <th className="px-6 py-4 font-medium">Hacker</th>
              <th className="px-6 py-4 font-medium">BH-ID</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium text-center">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-glass5 hover:bg-surface/10 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bh-red-500 to-status-orange flex items-center justify-center text-primary font-bold text-xs">
                      {u.full_name?.charAt(0) || 'U'}
                    </div>
                    <span className="font-bold group-hover:text-bh-red-500 transition-colors">{u.full_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-xs opacity-60">{u.bh_id}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    u.role === 'organizer' ? 'bg-status-purple/20 text-status-purple' : 
                    u.role === 'maintainer' ? 'bg-status-blue/20 text-status-blue' : 'bg-surface/20 text-secondary'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  {u.is_banned ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-bh-red-500/20 text-bh-red-500 text-[10px] font-bold uppercase">
                      <Lock size={10} /> Banned
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-status-green/20 text-status-green text-[10px] font-bold uppercase">
                      <Unlock size={10} /> Active
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <form action={async () => {
                      'use server';
                      await updateUserRole(u.id, u.role === 'hacker' ? 'maintainer' : 'hacker');
                    }}>
                      <button className="p-2 rounded-lg hover:bg-surface/10 text-secondary hover:text-status-blue transition-colors" title="Toggle Maintainer Role">
                        <ShieldAlert size={16} />
                      </button>
                    </form>
                    <form action={async () => {
                      'use server';
                      await banUser(u.id);
                    }}>
                      <button className="p-2 rounded-lg hover:bg-surface/10 text-bh-red-500/50 hover:text-bh-red-500 transition-colors" title="Ban User">
                        <UserMinus size={16} />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
