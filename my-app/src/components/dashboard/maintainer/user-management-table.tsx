"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import {updateUserRole} from '@/lib/actions/admin';
import { Shield, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  full_name: string;
  role: string;
  bh_id: string;
  email: string;
}

export default function UserManagementTable() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<{ id: string; role: string } | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, bh_id, email')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load users');
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
  }, [loadUsers]);

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      toast.success('User role updated successfully');
      await loadUsers();
    } catch {
      toast.error('Failed to update role');
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.bh_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="grid gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-surface/10 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
          <input 
            type="text" 
            placeholder="Search users by name, ID or email..." 
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface/10 border border-glass text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-glass bg-surface/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface/10 text-secondary uppercase text-[10px] font-bold tracking-widest">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Hacker ID</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="group hover:bg-background/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-bh-red-500/20 flex items-center justify-center text-bh-red-500 font-bold text-xs">
                      {user.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.full_name}</span>
                      <span className="text-xs text-secondary">{user.email}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-secondary">
                  {user.bh_id}
                </td>
                <td className="px-6 py-4">
                  {editingUser?.id === user.id ? (
                    <select 
                      className="bg-surface/10 border border-glass rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-red-500 outline-none"
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                      onBlur={() => {
                        if (editingUser.role !== user.role) {
                          handleRoleUpdate(user.id, editingUser.role);
                        }
                        setEditingUser(null);
                      }}
                      autoFocus
                    />
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      user.role === 'maintainer' ? 'bg-purple-500/20 text-purple-400' : 
                      user.role === 'organizer' ? 'bg-blue-500/20 text-blue-400' : 
                      'bg-surface/20 text-secondary'
                    }`}>
                      {user.role}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setEditingUser({ id: user.id, role: user.role })}
                      className="p-2 rounded-lg hover:bg-surface/10 text-secondary hover:text-primary transition-colors"
                      title="Edit Role"
                    >
                      <Shield size={16} />
                    </button>
                    <button 
                      className="p-2 rounded-lg hover:bg-bh-red-500/20 text-secondary hover:text-bh-red-500 transition-colors"
                      title="Revoke All Markers"
                      onClick={() => {
                        if(confirm('Are you sure you want to revoke all trust markers for this user?')) {
                          // Call a revoke all function (to be implemented)
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-secondary text-sm">
            No users found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
