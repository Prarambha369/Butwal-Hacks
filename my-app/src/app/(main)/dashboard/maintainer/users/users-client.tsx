"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Search, Shield, Ban, Check, X, Loader2, UserCheck, ShieldCheck, UserX, Users } from "lucide-react";

interface User {
  id: string;
  auth0_user_id: string | null;
  full_name: string | null;
  bh_id: string | null;
  email: string | null;
  role: string | null;
  is_banned: boolean | null;
  created_at: string | null;
  [key: string]: unknown;
}

interface RoleRequest {
  id: string;
  auth0_user_id: string;
  email: string | null;
  requested_role: string;
  message: string | null;
  status: string;
  created_at: string | null;
}

const ROLE_CLASSES: Record<string, string> = {
  maintainer: "text-primary-red bg-primary-red/10 border-primary-red/30",
  organizer: "text-status-blue bg-status-blue/10 border-status-blue/30",
  sponsor: "text-status-green bg-status-green/10 border-status-green/30",
  lead: "text-status-orange bg-status-orange/10 border-status-orange/30",
  hacker: "text-muted-foreground bg-surface-hover border-border",
};

const ROLE_LABELS: Record<string, string> = {
  maintainer: "Maintainer",
  organizer: "Organizer",
  sponsor: "Sponsor",
  lead: "Lead",
  hacker: "Hacker",
};

const ALL_ROLES = [
  { value: "hacker", label: "Hacker", desc: "Standard participant who joins events and submits projects" },
  { value: "organizer", label: "Organizer", desc: "Can create and manage events, issue trust markers" },
  { value: "maintainer", label: "Maintainer", desc: "Full system access — users, audit, site config" },
  { value: "sponsor", label: "Sponsor", desc: "Talent discovery, bounty management, company profile" },
  { value: "lead", label: "Lead", desc: "Chapter lead with local event and member management" },
];


export default function UsersClient({
  initialUsers,
  initialPendingRequests,
}: {
  initialUsers: User[];
  initialPendingRequests: RoleRequest[];
}) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [pendingRequests, setPendingRequests] = useState<RoleRequest[]>(initialPendingRequests);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleModal, setRoleModal] = useState<{ user: User; loading: boolean } | null>(null);
  const [banModal, setBanModal] = useState<{ user: User; loading: boolean } | null>(null);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        (u.full_name?.toLowerCase() ?? "").includes(q) ||
        (u.bh_id?.toLowerCase() ?? "").includes(q) ||
        (u.email?.toLowerCase() ?? "").includes(q) ||
        (u.role?.toLowerCase() ?? "").includes(q),
    );
  }, [users, searchQuery]);

  const activeCount = users.filter((u) => !u.is_banned).length;
  const bannedCount = users.filter((u) => u.is_banned).length;

  const handleRoleChange = async (userId: string, newRole: string) => {
    setRoleModal((prev) => (prev ? { ...prev, loading: true } : null));
    try {
      const { updateUserRole } = await import("@/lib/actions/admin");
      const result = await updateUserRole(userId, newRole);
      if (result.success) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
        toast.success(`Role updated to ${newRole}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setRoleModal(null);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      const { approveRoleRequest } = await import("@/lib/actions/admin");
      const result = await approveRoleRequest(requestId);
      if (result.success) {
        // Update the local user in the users list
        setUsers((prev) =>
          prev.map((u) =>
            u.auth0_user_id === result.user.auth0_user_id
              ? { ...u, role: result.user.role }
              : u,
          ),
        );
        // Remove the request from the pending list
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
        toast.success("Request approved. User role updated.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve request");
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      const { rejectRoleRequest } = await import("@/lib/actions/admin");
      const result = await rejectRoleRequest(requestId);
      if (result.success) {
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
        toast.success("Request rejected.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject request");
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleToggleBan = async (userId: string, currentlyBanned: boolean) => {
    setBanModal((prev) => (prev ? { ...prev, loading: true } : null));
    try {
      const { toggleBanUser } = await import("@/lib/actions/admin");
      const result = await toggleBanUser(userId, currentlyBanned);
      if (result.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, is_banned: !currentlyBanned } : u)),
        );
        toast.success(currentlyBanned ? "User unbanned" : "User banned");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update ban status");
    } finally {
      setBanModal(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage user roles, ban/unban accounts, and review activity.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, BH-ID, email, role…"
            className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2 text-sm text-primary placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary-red/30 transition-all"
          />
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          <strong className="text-primary">{users.length}</strong> total
        </span>
        <span className="flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-status-green" />
          <strong className="text-primary">{activeCount}</strong> active
        </span>
        <span className="flex items-center gap-1.5">
          <UserX className="w-3.5 h-3.5 text-primary-red" />
          <strong className="text-primary">{bannedCount}</strong> banned
        </span>
      </div>

      {/* Pending Role Requests */}
      {pendingRequests.length > 0 && (
        <div className="bh-card p-5 space-y-4 border-l-4 border-l-status-yellow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-status-yellow" />
              <h3 className="text-sm font-bold text-primary">
                Pending Role Requests ({pendingRequests.length})
              </h3>
            </div>
          </div>
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-start gap-4 p-4 rounded-lg bg-surface-hover border border-border"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary">
                      {ROLE_LABELS[req.requested_role] ?? req.requested_role}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {req.email ?? "—"}
                    </span>
                  </div>
                  {req.message && (
                    <p className="text-[11px] text-muted-foreground/80 line-clamp-2">
                      &ldquo;{req.message}&rdquo;
                    </p>
                  )}
                  {req.created_at && (
                    <p className="text-[10px] text-muted-foreground/50">
                      {new Date(req.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 pt-0.5">
                  <button
                    onClick={() => handleApproveRequest(req.id)}
                    disabled={processingRequest === req.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-status-green hover:bg-status-green/80 transition-all disabled:opacity-50"
                  >
                    {processingRequest === req.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectRequest(req.id)}
                    disabled={processingRequest === req.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-primary-red bg-primary-red/10 border border-primary-red/20 hover:bg-primary-red/20 transition-all disabled:opacity-50"
                  >
                    <X className="w-3 h-3" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User table */}
      <div className="bh-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-hover/50">
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">BH-ID</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Role</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    {searchQuery ? "No users match your search." : "No users found."}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {user.is_banned && (
                          <span title="Banned">
                            <Ban className="w-3 h-3 text-primary-red shrink-0" />
                          </span>
                        )}
                        <span className={`font-medium text-primary ${user.is_banned ? "line-through text-muted-foreground/60" : ""}`}>
                          {user.full_name ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{user.bh_id ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell truncate max-w-[200px]">
                      {user.email ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setRoleModal({ user, loading: false })}
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border transition-colors cursor-pointer",
                          ROLE_CLASSES[user.role ?? "hacker"],
                        )}
                      >
                        <Shield className="w-2.5 h-2.5" />
                        {user.role ?? "hacker"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setBanModal({ user, loading: false })}
                        className={`p-1.5 rounded-lg transition-colors ${
                          user.is_banned
                            ? "text-status-green hover:bg-status-green/10"
                            : "text-muted-foreground hover:text-primary-red hover:bg-primary-red/10"
                        }`}
                        title={user.is_banned ? "Unban user" : "Ban user"}
                      >
                        {user.is_banned ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role change modal */}
      {roleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20" onClick={() => !roleModal.loading && setRoleModal(null)}>
          <div className="bh-card p-6 w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-primary">Change Role</h3>
              <button onClick={() => setRoleModal(null)} className="p-1 rounded-md hover:bg-surface-hover text-muted-foreground hover:text-primary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              <strong className="text-primary">{roleModal.user.full_name ?? "Unknown"}</strong>
              {" — "}current role: <span className="font-mono">{roleModal.user.role ?? "hacker"}</span>
            </p>
            <div className="space-y-1.5">
              {ALL_ROLES.map((r) => {
                const isCurrent = r.value === roleModal.user.role;
                return (
                  <button
                    key={r.value}
                    disabled={isCurrent || roleModal.loading}
                    onClick={() => handleRoleChange(roleModal.user.id, r.value)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                      isCurrent
                        ? "border-primary-red/30 bg-primary-red/5 cursor-default"
                        : "border-border hover:border-primary-red/20 hover:bg-surface-hover cursor-pointer"
                    } disabled:opacity-50`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isCurrent ? "border-primary-red" : "border-border"
                    }`}>
                      {isCurrent && <div className="w-2 h-2 rounded-full bg-primary-red" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-primary">{r.label}</p>
                      <p className="text-[10px] text-muted-foreground">{r.desc}</p>
                    </div>
                    {roleModal.loading && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Ban confirmation modal */}
      {banModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20" onClick={() => !banModal.loading && setBanModal(null)}>
          <div className="bh-card p-6 w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-primary">
                {banModal.user.is_banned ? "Unban User" : "Ban User"}
              </h3>
              <button onClick={() => setBanModal(null)} className="p-1 rounded-md hover:bg-surface-hover text-muted-foreground hover:text-primary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {banModal.user.is_banned
                ? "Restore full access for this user. They will be able to log in and use the platform normally."
                : "Revoke access for this user. They will not be able to log in or use the platform until unbanned."}
            </p>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-hover border border-border">
              <ShieldCheck className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="text-xs">
                <p className="font-medium text-primary">{banModal.user.full_name ?? "Unknown"}</p>
                <p className="text-muted-foreground font-mono">{banModal.user.bh_id ?? banModal.user.email ?? ""}</p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setBanModal(null)}
                disabled={banModal.loading}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-primary hover:bg-surface-hover transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleToggleBan(banModal.user.id, banModal.user.is_banned ?? false)}
                disabled={banModal.loading}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all ${
                  banModal.user.is_banned
                    ? "bg-status-green hover:bg-status-green/80"
                    : "bg-primary-red hover:bg-deep-red"
                } disabled:opacity-50`}
              >
                {banModal.loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : banModal.user.is_banned ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5" /> Unban
                  </>
                ) : (
                  <>
                    <Ban className="w-3.5 h-3.5" /> Ban
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
