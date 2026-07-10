"use client";

import React, { useState } from "react";
import { KeyRound, Ban } from "lucide-react";
import { revokeApiKey } from "@/lib/actions/api-keys";
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
      <div className="lg-surface rounded-3xl p-12 text-center border border-glass">
        <KeyRound className="w-12 h-12 mx-auto text-secondary/40 mb-4" />
        <p className="text-secondary opacity-60">No API keys generated yet.</p>
        <p className="text-xs text-secondary/40 mt-2">Generate your first key to start using the API.</p>
      </div>
    );
  }

  return (
    <div className="lg-surface rounded-3xl overflow-hidden border border-glass">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface/10 text-xs font-mono uppercase tracking-widest opacity-40 border-b border-glass">
            <th className="px-6 py-4">Key Name</th>
            <th className="px-6 py-4">Last Used</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {keys.map((key) => (
            <tr key={key.id} className="hover:bg-surface/10 transition-colors group">
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{key.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 font-mono text-xs opacity-60">
                {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : "Never used"}
              </td>
              <td className="px-6 py-4 text-center">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${key.is_active ? "bg-green-500/20 text-green-400" : "bg-bh-red-500/20 text-bh-red-500"}`}>
                  {key.is_active ? "Active" : "Revoked"}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                {key.is_active && (
                  <button
                    onClick={() => handleRevoke(key.id)}
                    disabled={revokingId === key.id}
                    className="p-2 rounded-lg hover:bg-surface/10 text-secondary hover:text-bh-red-500 transition-colors disabled:opacity-40"
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

