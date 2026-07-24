"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Plus, Trash2, UserPlus, Loader2, Users, Check, X } from "lucide-react";
import { cn, getAvatarUrl } from "@/lib/utils";
import { toast } from "sonner";
import type { EventTeam, TeamFormationMember } from "@/lib/actions/teams";

interface TeamFormationClientProps {
  eventId: string;
  initialTeams: EventTeam[];
  initialUnassigned: TeamFormationMember[];
}

export function TeamFormationClient({
  eventId,
  initialTeams,
  initialUnassigned,
}: TeamFormationClientProps) {
  const [teams, setTeams] = useState<EventTeam[]>(initialTeams);
  const [unassigned, setUnassigned] = useState<TeamFormationMember[]>(initialUnassigned);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  const refreshData = useCallback(async () => {
    const [updatedTeams, updatedUnassigned] = await Promise.all([
      (await import("@/lib/actions/teams")).getEventTeams(eventId),
      (await import("@/lib/actions/teams")).getUnassignedAttendees(eventId),
    ]);
    setTeams(updatedTeams);
    setUnassigned(updatedUnassigned);
  }, [eventId]);

  const resetForm = useCallback(() => {
    setShowCreateForm(false);
    setNewTeamName("");
    setSelectedMembers(new Set());
  }, []);

  const handleCreate = useCallback(async () => {
    const name = newTeamName.trim();
    if (!name) {
      toast.error("Team name is required.");
      return;
    }

    setCreating(true);
    try {
      const { forceCreateTeam } = await import("@/lib/actions/teams");
      const result = await forceCreateTeam(eventId, name, [...selectedMembers]);

      if (!result.success) {
        toast.error(result.error ?? "Failed to create team.");
        return;
      }

      toast.success("Team created!");
      await refreshData();
      resetForm();
    } catch {
      toast.error("Failed to create team.");
    } finally {
      setCreating(false);
    }
  }, [newTeamName, selectedMembers, eventId, resetForm, refreshData]);

  const handleAddMember = useCallback(async (teamId: string, profileId: string) => {
    setAddingTo(teamId);
    try {
      const { forceAddTeamMember } = await import("@/lib/actions/teams");
      const result = await forceAddTeamMember(teamId, profileId);

      if (!result.success) {
        toast.error(result.error ?? "Failed to add member.");
        return;
      }

      toast.success("Member added.");
      setSelectedTeamId("");
      await refreshData();
    } catch {
      toast.error("Failed to add member.");
    } finally {
      setAddingTo(null);
    }
  }, [eventId, refreshData]);

  const handleRemoveMember = useCallback(async (teamId: string, profileId: string) => {
    try {
      const { removeTeamMember } = await import("@/lib/actions/teams");
      const result = await removeTeamMember(teamId, profileId);

      if (!result.success) {
        toast.error(result.error ?? "Failed to remove member.");
        return;
      }

      toast.success("Member removed.");
      await refreshData();
    } catch {
      toast.error("Failed to remove member.");
    }
  }, [eventId, refreshData]);

  const handleDeleteTeam = useCallback(async (teamId: string) => {
    try {
      const { deleteTeam } = await import("@/lib/actions/teams");
      const result = await deleteTeam(teamId);

      if (!result.success) {
        toast.error(result.error ?? "Failed to delete team.");
        return;
      }

      toast.success("Team deleted.");
      await refreshData();
    } catch {
      toast.error("Failed to delete team.");
    }
  }, [eventId, refreshData]);

  const toggleMember = useCallback((profileId: string) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(profileId)) {
        next.delete(profileId);
      } else {
        next.add(profileId);
      }
      return next;
    });
  }, []);

  const inputClass = "w-full bg-background/50 border border-border/30 rounded-lg px-4 py-3 outline-none transition-all duration-200 placeholder:text-muted/50 focus:border-bh-red-500/50 focus:ring-2 focus:ring-bh-red-500/20 hover:border-border/60 text-sm";

  return (
    <div className="space-y-8">
      {/* Create Team Section */}
      <div className="bh-card border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-primary flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary-red" />
            Create New Team
          </h2>
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-red text-white text-[10px] font-bold hover:bg-deep-red transition-all"
            >
              <Plus className="w-3 h-3" />
              New Team
            </button>
          )}
        </div>

        {showCreateForm && (
          <div className="space-y-4 pt-2 border-t border-border">
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
                Team Name
              </label>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="e.g. Team Alpha"
                className={inputClass}
                autoFocus
              />
            </div>

            {/* Member selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
                Assign Members ({selectedMembers.size} selected)
              </label>
              {unassigned.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 py-4 text-center">
                  No unassigned attendees available. All registered attendees are already on a team.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {unassigned.map((attendee) => (
                    <button
                      key={attendee.profile_id}
                      onClick={() => toggleMember(attendee.profile_id)}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all",
                        selectedMembers.has(attendee.profile_id)
                          ? "border-primary-red/50 bg-primary-red/5"
                          : "border-border hover:border-muted-foreground/30 bg-surface",
                      )}
                    >
                      <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1 ring-border">
                        <Image
                          src={getAvatarUrl(attendee.avatar_url, attendee.full_name)}
                          alt={attendee.full_name}
                          width={32}
                          height={32}
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-primary truncate">
                          {attendee.full_name}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground/50">
                          {attendee.bh_id}
                        </p>
                      </div>
                      {selectedMembers.has(attendee.profile_id) && (
                        <Check className="w-4 h-4 text-primary-red shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={resetForm}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-primary transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newTeamName.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary-red text-white text-xs font-bold hover:bg-deep-red transition-all disabled:opacity-50"
              >
                {creating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Plus className="w-3 h-3" />
                )}
                Create Team
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Teams List */}
      {teams.length === 0 && !showCreateForm ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-surface-hover flex items-center justify-center mx-auto mb-4 ring-1 ring-border">
            <Users className="w-6 h-6 text-muted-foreground/40" />
          </div>
          <p className="text-lg font-bold text-primary">No teams yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1 max-w-xs mx-auto">
            Create teams and assign attendees to organize participants for this event.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {teams.map((team) => (
            <div
              key={team.id}
              className="bh-card border border-border p-5 transition-all duration-200 hover:shadow-md"
            >
              {/* Team header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-primary">{team.name}</h3>
                  <p className="text-[10px] font-mono text-muted-foreground/50">
                    {team.member_count} member{team.member_count !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteTeam(team.id)}
                  className="p-2 rounded-lg text-muted-foreground/40 hover:text-primary-red transition-colors"
                  title="Delete team"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Members list */}
              <div className="space-y-2">
                {team.members.map((member) => (
                  <div
                    key={member.profile_id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1 ring-border">
                        <Image
                          src={getAvatarUrl(member.avatar_url, member.full_name)}
                          alt={member.full_name}
                          width={32}
                          height={32}
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-primary">{member.full_name}</p>
                        <p className="text-[9px] font-mono text-muted-foreground/50">{member.bh_id}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(team.id, member.profile_id)}
                      className="p-1.5 rounded-md text-muted-foreground/30 hover:text-primary-red transition-colors"
                      title="Remove member"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add member button */}
              {unassigned.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  {addingTo === team.id ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Adding member...
                    </div>
                  ) : (
                    <div className="relative group">
                      <select
                        value={selectedTeamId === team.id ? selectedTeamId : ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            handleAddMember(team.id, val);
                          }
                        }}
                        className="w-full py-2 px-3 rounded-lg border border-border/50 bg-surface text-xs text-muted-foreground cursor-pointer focus:outline-none focus:border-primary-red/30 appearance-none"
                      >
                        <option value="" disabled>
                          Add member from attendees...
                        </option>
                        {unassigned.map((a) => (
                          <option key={a.profile_id} value={a.profile_id}>
                            {a.full_name} ({a.bh_id})
                          </option>
                        ))}
                      </select>
                      <UserPlus className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 pointer-events-none" />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
