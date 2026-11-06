"use client";

import { useState, useEffect } from "react";
import { useAuthUser } from "@/components/auth-user-provider";
import {
  GitBranch,

  Mail,
  User,
  Users,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Shield,
} from "lucide-react";

interface MergeCandidate {
  profile_id: string;
  email: string | null;
  slug_id: string;
  role: string;
  full_name: string | null;
  github_username: string | null;
  linked_accounts: { provider: string; email: string | null; name: string | null }[];
  created_at: string;
  match_reason: "same-email" | "same-github" | "linked-identity" | "manual";
}

interface MergePreview {
  target_profile: {
    id: string;
    email: string | null;
    github_username: string | null;
    role: string;
    slug_id: string;
  };
  source_profile: {
    id: string;
    email: string | null;
    github_username: string | null;
    role: string;
    slug_id: string;
    full_name: string | null;
    created_at: string;
  };
  merged_result: {
    email: string | null;
    github_username: string | null;
    skills: string[];
    socials: Record<string, string>;
    linked_accounts: { provider: string; email: string | null; name: string | null }[];
  };
  changes: Record<string, { from: unknown; to: unknown }>;
  warning: string | null;
}

export function AccountConsolidation() {
  const { user } = useAuthUser();
  const [candidates, setCandidates] = useState<MergeCandidate[]>([]);
  const [selectedSource, setSelectedSource] = useState<MergeCandidate | null>(null);
  const [preview, setPreview] = useState<MergePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [candidatesLoaded, setCandidatesLoaded] = useState(false);

  // Load merge candidates on mount
  useEffect(() => {
    if (!user) return;
    loadCandidates();
  }, [user]);

  async function loadCandidates() {
    setError(null);
    try {
      const res = await fetch("/api/account/merge/candidates");
      if (!res.ok) throw new Error("Failed to load candidates");
      const data = await res.json();
      setCandidates(data.candidates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setCandidatesLoaded(true);
    }
  }

  async function loadPreview(sourceId: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/account/merge/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_profile_id: sourceId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load preview");
      }
      const data = await res.json();
      setPreview(data.merge_preview);
      setSelectedSource(
        candidates.find((c) => c.profile_id === sourceId) || null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function submitMerge() {
    if (!selectedSource) return;
    setSubmitting(true);
    setStatus("idle");
    setError(null);
    try {
      const res = await fetch("/api/account/merge/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_profile_id: selectedSource.profile_id,
          confirm: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Merge failed");
      }
      setStatus("success");
      // Clear the stale preview so the UI reflects the merge immediately.
      setPreview(null);
      setSelectedSource(null);
      setError(null);
      // Refresh candidates after merge
      setTimeout(loadCandidates, 2000);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="bh-card p-6 text-center text-muted-foreground">
        Sign in to manage your account connections.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary-red/10">
          <Shield className="w-5 h-5 text-primary-red" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-primary">
            Account Connections
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage multiple accounts and merge them into one.
          </p>
        </div>
      </div>

      {/* Success message */}
      {status === "success" && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-800">Accounts merged successfully</p>
            <p className="text-sm text-green-700 mt-1">
              The other profile has been deactivated. Your data is now combined.
            </p>
          </div>
        </div>
      )}

      {/* Error message (load, preview or merge) */}
      {error && status !== "success" && (
        <div role="alert" className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">
              {status === "error" ? "Merge failed" : "Something went wrong"}
            </p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Loading skeleton (three cards) */}
      {!candidatesLoaded && (
        <div data-testid="candidate-skeletons" className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              data-testid="candidate-skeleton"
              className="bh-card p-4 border border-border animate-pulse"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-surface w-9 h-9 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 rounded bg-surface" />
                  <div className="h-3 w-48 rounded bg-surface" />
                  <div className="h-3 w-40 rounded bg-surface" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Merge candidates */}
      {candidates.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-md font-semibold text-primary flex items-center gap-2">
            <Users className="w-4 h-4" />
            Other Accounts Found
          </h3>
          <p className="text-sm text-muted-foreground">
            We found other profiles that may be yours. Merge them to combine your data.
          </p>

          <div className="space-y-3">
            {candidates.map((candidate) => (
              <div
                key={candidate.profile_id}
                className={`bh-card p-4 border transition-all ${
                  selectedSource?.profile_id === candidate.profile_id
                    ? "border-primary-red ring-1 ring-primary-red/20"
                    : "border-border hover:border-primary-red/30"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gray-100">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary">
                          {candidate.slug_id}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({candidate.role})
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 space-y-1">
                        {candidate.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3" />
                            {candidate.email}
                          </div>
                        )}
                        {candidate.github_username && (
                          <div className="flex items-center gap-2">
                            <GitBranch className="w-3 h-3" />
                            {candidate.github_username}
                          </div>
                        )}
                        {candidate.full_name && (
                          <div className="text-sm">{candidate.full_name}</div>
                        )}
                      </div>
                      {candidate.match_reason !== "manual" && (
                        <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-primary-red bg-primary-red/10 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          Matches: {candidate.match_reason.replace("-", " ")}
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedSource?.profile_id !== candidate.profile_id ? (
                    <button
                      onClick={() => loadPreview(candidate.profile_id)}
                      className="shrink-0 px-3 py-1.5 text-sm font-medium text-primary-red hover:bg-primary-red/10 rounded-lg transition-colors"
                    >
                      {loading && selectedSource?.profile_id === candidate.profile_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Review Merge"
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={submitMerge}
                      disabled={submitting}
                      className="shrink-0 px-3 py-1.5 text-sm font-medium bg-primary-red text-white hover:bg-deep-red rounded-lg transition-colors flex items-center gap-1"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Merging...
                        </>
                      ) : (
                        "Merge Accounts"
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No candidates (shown only after the first load resolves) */}
      {candidatesLoaded && candidates.length === 0 && status !== "success" && (
        <div className="bh-card p-6 text-center">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            No other accounts found that can be merged.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            If you have multiple accounts, link them via the{" "}
            <a href="/dashboard/hacker/connections" className="text-primary-red hover:underline">
              Connected Accounts
            </a> page.
          </p>
        </div>
      )}

      {/* Merge preview (shown when a source is selected) */}
      {preview && selectedSource && (
        <div className="bh-card p-6 border-primary-red/30 bg-primary-red/5">
          <h3 className="text-md font-semibold text-primary flex items-center gap-2 mb-4">
            <CheckCircle className="w-4 h-4" />
            Merge Preview
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Target profile */}
            <div className="p-4 rounded-lg bg-surface border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  Keep this account
                </span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Slug ID</span>
                  <span className="font-mono">{preview.target_profile.slug_id}</span>
                </div>
                {preview.target_profile.email && (
                  <div className="flex justify-between">
                    <span>Email</span>
                    <span className="font-mono text-xs">{preview.target_profile.email}</span>
                  </div>
                )}
                {preview.target_profile.github_username && (
                  <div className="flex justify-between">
                    <span>GitHub</span>
                    <span className="font-mono text-xs">{preview.target_profile.github_username}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Source profile */}
            <div className="p-4 rounded-lg bg-surface border border-border">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-primary-red" />
                <span className="text-sm font-semibold text-primary-red">
                  Merge into above
                </span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Slug ID</span>
                  <span className="font-mono">{preview.source_profile.slug_id}</span>
                </div>
                {preview.source_profile.email && (
                  <div className="flex justify-between">
                    <span>Email</span>
                    <span className="font-mono text-xs">{preview.source_profile.email}</span>
                  </div>
                )}
                {preview.source_profile.github_username && (
                  <div className="flex justify-between">
                    <span>GitHub</span>
                    <span className="font-mono text-xs">{preview.source_profile.github_username}</span>
                  </div>
                )}
                {preview.source_profile.full_name && (
                  <div className="flex justify-between">
                    <span>Name</span>
                    <span>{preview.source_profile.full_name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Created</span>
                  <span className="text-xs">
                    {new Date(preview.source_profile.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* What will be merged */}
          <div className="p-4 rounded-lg bg-surface border border-border mb-4">
            <h4 className="text-sm font-semibold text-primary mb-2">
              Combined result
            </h4>
            <div className="text-sm text-muted-foreground space-y-1">
              {preview.merged_result.email && (
                <div className="flex justify-between">
                  <span>Email</span>
                  <span className="font-mono text-xs">{preview.merged_result.email}</span>
                </div>
              )}
              {preview.merged_result.github_username && (
                <div className="flex justify-between">
                  <span>GitHub</span>
                  <span className="font-mono text-xs">{preview.merged_result.github_username}</span>
                </div>
              )}
              {preview.merged_result.skills.length > 0 && (
                <div className="flex justify-between">
                  <span>Skills</span>
                  <span className="text-xs">
                    {preview.merged_result.skills.length} skills
                  </span>
                </div>
              )}
              {Object.keys(preview.merged_result.socials).length > 0 && (
                <div className="flex justify-between">
                  <span>Social links</span>
                  <span className="text-xs">
                    {Object.keys(preview.merged_result.socials).length} links
                  </span>
                </div>
              )}
              {preview.merged_result.linked_accounts.length > 0 && (
                <div className="flex justify-between">
                  <span>Linked accounts</span>
                  <span className="text-xs">
                    {preview.merged_result.linked_accounts.length} accounts
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Warning */}
          {preview.warning && (
            <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{preview.warning}</span>
            </div>
          )}

          {/* Changes will be made */}
          <div className="text-sm text-muted-foreground mt-2">
            <p className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              The other profile will be deactivated. This cannot be undone.
            </p>
          </div>

          {/* Confirm button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={submitMerge}
              disabled={submitting}
              className="px-4 py-2 bg-primary-red text-white hover:bg-deep-red rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Merging...
                </>
              ) : (
                "Confirm Merge"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
