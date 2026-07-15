"use client";

import { useState, useEffect } from "react";
import { Key, Plus, Copy, Trash2, CheckCircle2, AlertCircle, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
interface ApiKey {
  id: string;
  prefix: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);


  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/v1/api-keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys ?? []);
      }
    } catch {
      // No API yet — show empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for your API key");
      return;
    }

    try {
      const res = await fetch("/api/v1/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create API key");
      }

      const data = await res.json();
      setCreatedKey(data.key);
      setNewKeyName("");
      setShowNewForm(false);
      toast.success("API key created! Copy it now — you won&apos;t see it again.");
      await fetchKeys();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create API key");
    }
  };

  const handleRevoke = async (keyId: string) => {
    try {
      const res = await fetch(`/api/v1/api-keys`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: keyId }),
      });

      if (!res.ok) throw new Error("Failed to revoke key");

      toast.success("API key revoked");
      await fetchKeys();
    } catch {
      toast.error("Failed to revoke API key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary-red" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">API Keys</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage API keys for programmatic access to Butwal Hacks data.
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-deep-red transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New Key
        </button>
      </div>

      {/* Create form */}
      {showNewForm && (
        <div className="bh-card p-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <h3 className="text-sm font-bold text-primary mb-3">Create New API Key</h3>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g., My CLI Tool"
              className="bh-input"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <button
              onClick={handleCreate}
              disabled={!newKeyName.trim()}
              className="rounded-full bg-bh-red-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-deep-red transition-all disabled:opacity-40"
            >
              Generate
            </button>
            <button
              onClick={() => setShowNewForm(false)}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-primary transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Newly created key — show once */}
      {createdKey && (
        <div className="rounded-lg border border-status-green/30 bg-status-green/5 p-5 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-status-green shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-primary mb-1">API Key Created</p>
              <p className="text-xs text-muted-foreground mb-3">
                Copy this key now. For security reasons, you won&apos;t be able to see it again.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 block rounded-lg bg-background border border-border px-4 py-2.5 text-xs font-mono text-primary break-all">
                  {createdKey}
                </code>
                <button
                  onClick={() => copyToClipboard(createdKey)}
                  className="p-2.5 rounded-lg bg-surface-hover hover:bg-surface/20 text-muted-foreground hover:text-primary transition-all"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keys list */}
      {keys.length === 0 ? (
        <div className="bh-card p-10 text-center">            <div className="mx-auto w-14 h-14 rounded-full bg-surface-hover flex items-center justify-center mb-4">
            <Key className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-base font-bold text-primary mb-1">No API Keys</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Create your first API key to start integrating Butwal Hacks data into your tools and applications.
          </p>
          <button
            onClick={() => setShowNewForm(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-deep-red transition-all"
          >
            <Plus className="w-4 h-4" />
            Create API Key
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => {
            return (
              <div
                key={key.id}
                className={cn(
                  "bh-card border p-4 transition-all",
                  key.is_active ? "border-border" : "border-border/50 opacity-60"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      key.is_active ? "bg-primary-red/10" : "bg-surface-hover"
                    )}>
                      <Key className={cn(
                        "w-4 h-4",
                        key.is_active ? "text-primary-red" : "text-muted-foreground"
                      )} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary">{key.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <code className="text-[10px] font-mono text-muted-foreground">
                          {key.prefix}...
                        </code>
                        {!key.is_active && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-status-orange">
                            <AlertCircle className="w-2.5 h-2.5" />
                            Revoked
                          </span>
                        )}
                        {key.is_active && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-status-green">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {key.is_active && (
                      <button
                        onClick={() => handleRevoke(key.id)}
                        className="p-2 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-status-orange transition-colors"
                        title="Revoke key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Key metadata */}
                <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Created {new Date(key.created_at).toLocaleDateString()}
                  </span>
                  {key.last_used_at && (
                    <span className="inline-flex items-center gap-1">
                      Last used {new Date(key.last_used_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Usage info */}
      <div className="bh-card p-5">
        <h3 className="text-sm font-bold text-primary mb-2">How to use your API key</h3>
        <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
          <p>Include your API key in the <code className="px-1 py-0.5 rounded bg-background/50 font-mono text-primary-red">Authorization</code> header:</p>
          <code className="block rounded-lg bg-background/50 border border-border px-4 py-3 text-[10px] font-mono text-muted-foreground">
            curl -H &quot;Authorization: Bearer YOUR_API_KEY&quot; \<br />
            &nbsp;&nbsp;https://api.butwalhacks.com/v1/profiles
          </code>
          <p className="mt-2">
            Base URL: <code className="px-1 py-0.5 rounded bg-background/50 font-mono text-primary-red">https://api.butwalhacks.com/v1</code>
          </p>
        </div>
      </div>
    </div>
  );
}
