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
      <div className="bh-card p-6 border-primary-red/30 space-y-4">
        <h3 className="text-sm font-bold text-primary">Key Generated — Copy It Now</h3>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-hover border border-border font-mono text-xs break-all">
          <code className="text-primary-red">{newKey}</code>
        </div>
        <p className="text-[10px] text-muted-foreground">
          This key will not be shown again. Store it securely.
        </p>
        <div className="flex gap-2">
          <button
            onClick={copyKey}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bh-red-500 text-white text-xs font-bold hover:bg-deep-red transition-all"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy to Clipboard"}
          </button>
          <button
            onClick={() => setNewKey(null)}
            className="px-4 py-2 rounded-lg bg-surface border border-border text-xs font-medium text-muted-foreground hover:text-primary transition-all"
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
        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-bh-red-500 text-white text-sm font-bold hover:bg-deep-red transition-all"
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
        className="bh-input w-56"
        autoFocus
        disabled={isGenerating}
      />
      <button
        type="submit"
        disabled={isGenerating}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-bh-red-500 text-white text-sm font-bold hover:bg-deep-red transition-all disabled:opacity-50"
      >
        {isGenerating ? "Generating..." : "Generate"}
      </button>
      <button
        type="button"
        onClick={() => setShowForm(false)}
        className="px-4 py-2.5 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        Cancel
      </button>
    </form>
  );
}
