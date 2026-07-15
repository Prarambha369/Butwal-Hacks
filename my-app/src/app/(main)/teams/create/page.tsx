"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Users } from "lucide-react";
import Link from "next/link";

export default function CreateTeamPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Team name is required.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create team.");
        setSubmitting(false);
        return;
      }

      router.push(`/teams/${data.team.id}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto max-w-2xl px-4 py-14 sm:py-16">
        {/* Back link */}
        <Link
          href="/teams"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors group mb-8"
        >
          <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
          Back to Teams
        </Link>

        <div className="space-y-6">
          <div>
            <div className="inline-flex p-3 rounded-xl bg-primary-red/10 text-primary-red mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-primary">
              Create a Team
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Teams let you collaborate with fellow hackers on projects and compete in events together.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-primary">
                Team Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Team Innovators"
                className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-primary placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary-red/30 transition-all"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-primary-red bg-primary-red/5 rounded-lg px-3 py-2 border border-primary-red/20">
                {error}
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full bg-primary-red px-6 py-2.5 text-sm font-bold text-white hover:bg-deep-red transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {submitting ? "Creating..." : "Create Team"}
              </button>
              <Link
                href="/teams"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
