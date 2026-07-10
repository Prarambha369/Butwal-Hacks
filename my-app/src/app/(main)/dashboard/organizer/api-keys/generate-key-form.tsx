"use client";

import React, { useState } from "react";
import { KeyRound, Copy, Check } from "lucide-react";
import { generateApiKey } from "@/lib/actions/api-keys";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function GenerateKeyForm() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a name for the key");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateApiKey(name.trim());
      if (result.success && result.key) {
        setNewKey(result.key);
        setName("");
        toast.success("API key generated! Copy it now — it won't be shown again.");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to generate key");
      }
    } catch {
      toast.error("Failed to generate key");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyKey = async () => {
    if (!newKey) return;
    try {
      await navigator.clipboard.writeText(newKey);
      setCopied(true);
      toast.success("API key copied to clipboard");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  if (newKey) {
    return (
      <div className="lg-surface rounded-3xl p-6 border border-bh-red-500/30 shadow-[0_0_15px_rgba(254,0,0,0.2)] space-y-4">
        <h3 className="text-sm font-bold text-primary">Key Generated — Copy It Now</h3>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-background/50 border border-glass font-mono text-xs break-all">
          <code className="text-bh-red-500">{newKey}</code>
        </div>
        <p className="text-[10px] text-secondary/60">
          This key will not be shown again. Store it securely.
        </p>
        <div className="flex gap-2">
          <button
            onClick={copyKey}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bh-red-500 text-white text-xs font-bold hover:bg-bh-red-600 transition-all"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy to Clipboard"}
          </button>
          <button
            onClick={() => setNewKey(null)}
            className="px-4 py-2 rounded-xl bg-surface/10 border border-glass text-xs font-medium text-secondary hover:text-primary transition-all"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-bh-red-500 text-white text-sm font-bold hover:bg-bh-red-600 transition-all hover:scale-[1.02]"
      >
        <KeyRound size={16} /> Generate New Key
      </button>
    );
  }

  return (
    <form onSubmit={handleGenerate} className="flex items-center gap-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Key name (e.g., CI/CD Pipeline)"
        className="bg-surface/10 border border-glass rounded-xl px-4 py-2.5 text-sm text-primary outline-none focus:ring-2 focus:ring-bh-red-500/20 focus:border-bh-red-500/50 transition-all w-56"
        autoFocus
        disabled={isGenerating}
      />
      <button
        type="submit"
        disabled={isGenerating}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-bh-red-500 text-white text-sm font-bold hover:bg-bh-red-600 transition-all hover:scale-[1.02] disabled:opacity-50"
      >
        {isGenerating ? "Generating..." : "Generate"}
      </button>
      <button
        type="button"
        onClick={() => setShowForm(false)}
        className="px-4 py-2.5 text-sm text-secondary hover:text-primary transition-colors"
      >
        Cancel
      </button>
    </form>
  );
}
