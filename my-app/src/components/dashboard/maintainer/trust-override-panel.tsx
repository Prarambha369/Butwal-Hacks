"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  XCircle,
  RotateCcw,
  Search,
  AlertTriangle,
  Loader2,
  X,
  UserCheck,
  Calendar,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { revokeTrustMarker, reinstateTrustMarker } from "@/lib/actions/admin";
import type { TrustMarker } from "@/lib/supabase-types";
import { cn } from "@/lib/utils";

interface MarkerWithProfiles extends TrustMarker {
  holder_name?: string | null;
  holder_bh_id?: string | null;
  issuer_name?: string | null;
}

interface TrustOverridePanelProps {
  markers: MarkerWithProfiles[];
}

type SortKey = "newest" | "oldest" | "title" | "holder";

export default function TrustOverridePanel({ markers }: TrustOverridePanelProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "revoked">("all");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [reinstating, setReinstating] = useState<string | null>(null);

  const [reinstateConfirm, setReinstateConfirm] = useState<string | null>(null);

  // Revoke modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<MarkerWithProfiles | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── Filtering & sorting ────────────────────────────────────
  let filtered = [...markers];

  // Search
  if (search.trim()) {
    const term = search.toLowerCase();
    filtered = filtered.filter(
      (m) =>
        m.title.toLowerCase().includes(term) ||
        m.holder_name?.toLowerCase().includes(term) ||
        m.holder_bh_id?.toLowerCase().includes(term) ||
        m.type.toLowerCase().includes(term) ||
        m.description?.toLowerCase().includes(term),
    );
  }

  // Status filter
  if (statusFilter === "active") filtered = filtered.filter((m) => !m.is_revoked);
  if (statusFilter === "revoked") filtered = filtered.filter((m) => m.is_revoked);

  // Sort
  filtered.sort((a, b) => {
    const aTime = new Date(a.created_at ?? 0).getTime();
    const bTime = new Date(b.created_at ?? 0).getTime();
    switch (sortBy) {
      case "newest":
        return bTime - aTime;
      case "oldest":
        return aTime - bTime;
      case "title":
        return a.title.localeCompare(b.title);
      case "holder":
        return (a.holder_name || "").localeCompare(b.holder_name || "");
      default:
        return 0;
    }
  });

  // ── Actions ────────────────────────────────────────────────
  const openRevokeModal = (marker: MarkerWithProfiles) => {
    setSelectedMarker(marker);
    setRevokeReason("");
    setModalOpen(true);
  };

  const handleRevoke = async () => {
    if (!selectedMarker || revokeReason.trim().length < 5) return;
    setSubmitting(true);
    try {
      const result = await revokeTrustMarker(selectedMarker.id, revokeReason);
      if (result.success) {
        toast.success("Trust marker revoked");
        setModalOpen(false);
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReinstate = async (markerId: string) => {
    setReinstating(markerId);
    setReinstateConfirm(null);
    try {
      const result = await reinstateTrustMarker(markerId);
      if (result.success) {
        toast.success("Trust marker reinstated");
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reinstate");
    } finally {
      setReinstating(null);
    }
  };

  const stats = {
    total: markers.length,
    active: markers.filter((m) => !m.is_revoked).length,
    revoked: markers.filter((m) => m.is_revoked).length,
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bh-card p-4 text-center">
          <p className="text-2xl font-bold text-primary">{stats.total}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
            Total
          </p>
        </div>
        <div className="bh-card p-4 text-center">
          <p className="text-2xl font-bold text-status-green">{stats.active}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
            Active
          </p>
        </div>
        <div className="bh-card p-4 text-center">
          <p className="text-2xl font-bold text-primary-red">{stats.revoked}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
            Revoked
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by marker title, holder name, or BH-ID..."
            className="bh-input pl-9"
            aria-label="Search trust markers"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="bh-select min-w-[140px]"
          aria-label="Filter by marker status"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="revoked">Revoked Only</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="bh-select min-w-[140px]"
          aria-label="Sort trust markers"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="title">By Title</option>
          <option value="holder">By Holder</option>
        </select>
      </div>

      {/* Marker list */}
      {filtered.length === 0 ? (
        <div className="bh-card p-12 text-center">
          <div className="inline-flex p-3 rounded-lg bg-surface-hover mb-4">
            <ShieldCheck className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-bold text-primary">No trust markers found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {search
              ? "Try a different search term or filter"
              : "No markers have been issued yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((marker) => (
            <div
              key={marker.id}
              className={cn(
                "bh-card p-5 transition-all",
                marker.is_revoked
                  ? "border-bh-red-500/20"
                  : "border-border hover:border-border/80"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: marker info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                        marker.is_revoked
                          ? "bg-primary-red/10 border-primary-red/30 text-primary-red line-through"
                          : "bg-status-green/10 border-status-green/30 text-status-green"
                      )}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          marker.is_revoked ? "bg-bh-red-500" : "bg-status-green"
                        )}
                      />
                      {marker.is_revoked ? "Revoked" : "Active"}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 rounded-full bg-surface-hover border border-border">
                      {marker.type.replace(/_/g, " ")}
                    </span>
                  </div>

                  <h3
                    className={cn(
                      "text-base font-bold",
                      marker.is_revoked
                        ? "text-muted-foreground line-through"
                        : "text-primary"
                    )}
                  >
                    {marker.title}
                  </h3>

                  {marker.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {marker.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    {marker.holder_name ? (
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        {marker.holder_name}
                        {marker.holder_bh_id && (
                          <span className="font-mono opacity-60">
                            · {marker.holder_bh_id}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 italic">
                        <UserCheck className="w-3 h-3" />
                        Unclaimed / Ghost
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(marker.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    {marker.is_revoked && marker.revocation_reason && (
                      <span className="flex items-center gap-1 text-primary-red/70">
                        <AlertTriangle className="w-3 h-3" />
                        {marker.revocation_reason}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {marker.is_revoked ? (
                    <button
                      onClick={() => setReinstateConfirm(marker.id)}
                      disabled={reinstating === marker.id}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all border",
                        "bg-surface-hover border-status-green/30 text-status-green hover:bg-status-green/10 disabled:opacity-50"
                      )}
                      title="Reinstate this trust marker"
                    >
                      {reinstating === marker.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5" />
                      )}
                      Reinstate
                    </button>
                  ) : (
                    <button
                      onClick={() => openRevokeModal(marker)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all border bg-surface-hover border-primary-red/30 text-primary-red hover:bg-primary-red/10"
                      title="Revoke this trust marker"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reinstate confirmation modal */}
      {reinstateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setReinstateConfirm(null)}
          />
          <div className="relative w-full max-w-sm bg-background border border-status-green/30 rounded-lg p-6 space-y-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-status-green/10 border border-status-green/20">
                <RotateCcw className="w-5 h-5 text-status-green" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary">Reinstate Marker</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  This will restore the trust marker to active status.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setReinstateConfirm(null)}
                className="px-4 py-2.5 rounded-lg bg-surface-hover hover:bg-border text-muted-foreground text-sm font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReinstate(reinstateConfirm)}
                disabled={reinstating === reinstateConfirm}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-status-green text-white text-sm font-bold transition-all hover:opacity-80 disabled:opacity-50"
              >
                {reinstating === reinstateConfirm ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                Confirm Reinstate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke confirmation modal */}
      {modalOpen && selectedMarker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setModalOpen(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-lg bg-background border border-primary-red/30 rounded-lg p-6 space-y-5 shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-red/10 border border-primary-red/20">
                  <AlertTriangle className="w-5 h-5 text-primary-red" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary">Revoke Trust Marker</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    This action is reversible — you can reinstate later.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-primary transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Marker preview */}
            <div className="bg-surface-hover rounded-lg p-4 border border-border space-y-1">
              <p className="text-sm font-bold text-primary">{selectedMarker.title}</p>
              <p className="text-xs text-muted-foreground">
                {selectedMarker.holder_name || "Unclaimed / Ghost"}
                {selectedMarker.holder_bh_id && ` · ${selectedMarker.holder_bh_id}`}
              </p>
              {selectedMarker.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {selectedMarker.description}
                </p>
              )}
            </div>

            {/* Reason input */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <FileText className="w-3 h-3" /> Revocation Reason
              </label>
              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                rows={3}
                placeholder="Explain why this marker is being revoked (required, min 5 chars)..."
                className="bh-textarea"
                autoFocus
              />
              <p className="text-[10px] text-muted-foreground text-right">
                {revokeReason.length}/500
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 rounded-lg bg-surface-hover hover:bg-border text-muted-foreground text-sm font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRevoke}
                disabled={revokeReason.trim().length < 5 || submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-bh-red-500 text-white text-sm font-bold transition-all hover:bg-deep-red disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                {submitting ? "Revoking..." : "Confirm Revocation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
