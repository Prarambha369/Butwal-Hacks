"use client";

import React, { useState } from "react";
import { KeyRound, Ban } from "lucide-react";
import { revokeApiKey } from "@/lib/actions/api-keys";
import { formatDualDate } from "@/lib/nepali-date";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ApiKey {
  id: string;
  name: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export function ApiKeyList({ keys }: { keys: ApiKey[] }) {
  const router = useRouter();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const handleRevoke = async (keyId: string) => {
    setRevokingId(keyId);
    try {
      const result = await revokeApiKey(keyId);
      if (result.success) {
        toast.success("API key revoked");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to revoke key");
      }
    } catch {
      toast.error("Failed to revoke key");
    } finally {
      setRevokingId(null);
    }
  };

  if (keys.length === 0) {
    return (
      <div className="bh-card p-12 text-center">
        <KeyRound className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">No API keys generated yet.</p>
        <p className="text-xs text-muted-foreground mt-2">Generate your first key to start using the API.</p>
      </div>
    );
  }

  return (
    <div className="bh-card overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border">
            <th className="px-5 py-3.5">Key Name</th>
            <th className="px-5 py-3.5">Last Used</th>
            <th className="px-5 py-3.5 text-center">Status</th>
            <th className="px-5 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((key) => (
            <tr key={key.id} className="border-b border-border last:border-b-0 hover:bg-surface-hover transition-colors group">
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-primary">{key.name}</span>
                </div>
              </td>
              <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                {key.last_used_at ? formatDualDate(new Date(key.last_used_at)) : "Never used"}
              </td>
              <td className="px-6 py-4 text-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${key.is_active ? "bg-status-green/10 border-status-green/30 text-status-green" : "bg-primary-red/10 border-primary-red/30 text-primary-red"}`}>
                  {key.is_active ? "Active" : "Revoked"}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                {key.is_active && (
                  <button
                    onClick={() => handleRevoke(key.id)}
                    disabled={revokingId === key.id}
                    className="p-2 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-primary-red transition-colors disabled:opacity-40"
                    title="Revoke Key"
                  >
                    <Ban size={16} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

