"use client";

import { useState } from "react";
import { Check, X, Star, Trash2, Plus } from "lucide-react";
import {
  getTestimonialQueue,
  setTestimonialStatus,
  toggleTestimonialFeatured,
  deleteTestimonial,
  addVipQuote,
  type ModeratedTestimonial,
} from "@/lib/actions/testimonials";

function initialsOf(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function Attribution({ item }: { item: ModeratedTestimonial }) {
  const name = item.guest_name || item.profile?.full_name || "A Mysterious Hacker";
  const sub = item.guest_title
    || (item.profile?.bh_id ? `BH-ID ${item.profile.bh_id}` : null);
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-hover border border-border text-[11px] font-bold text-text-secondary font-mono">
        {initialsOf(name)}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-primary">{name}</p>
        {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const color = status === "approved"
    ? "text-status-green bg-status-green/8"
    : status === "rejected"
      ? "text-primary-red bg-primary-red/8"
      : "text-status-yellow bg-status-yellow/8";
  return (
    <span className={`inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-md ${color}`}>
      {status}
    </span>
  );
}

function VipForm({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [quote, setQuote] = useState("");
  const [source, setSource] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await addVipQuote({ name, title, quote, source });
      setName(""); setTitle(""); setQuote(""); setSource("");
      setOpen(false);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-bold text-primary hover:bg-surface-hover transition-all active:scale-95"
      >
        <Plus className="h-4 w-4" /> Add VIP quote
      </button>
    );
  }

  return (
    <form onSubmit={save} className="bh-card space-y-4 p-6">
      <h3 className="text-base font-bold text-primary">New VIP quote</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        For words spoken by guests with no platform account (principals, speakers).
        Saved approved + featured immediately.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={200}
          placeholder="Name — e.g. Sita Sharma"
          className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-primary placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary-red/40"
        />
        <input
          value={title} onChange={(e) => setTitle(e.target.value)} required minLength={2} maxLength={200}
          placeholder="Title — e.g. Principal, XYZ School"
          className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-primary placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary-red/40"
        />
      </div>
      <textarea
        value={quote} onChange={(e) => setQuote(e.target.value)} required minLength={10} maxLength={2000} rows={3}
        placeholder="Their words, as spoken…"
        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary-red/40"
      />
      <input
        value={source} onChange={(e) => setSource(e.target.value)} maxLength={300}
        placeholder="Source occasion (optional) — e.g. said at Butwal orientation, Mar 2026"
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-primary placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary-red/40"
      />
      {error && <p className="text-sm text-primary-red" role="alert">{error}</p>}
      <div className="flex items-center gap-2">
        <button type="submit" disabled={saving} className="bh-btn-primary text-sm disabled:opacity-50">
          {saving ? "Saving…" : "Publish quote"}
        </button>
        <button
          type="button" onClick={() => setOpen(false)}
          className="rounded-full px-5 py-2.5 text-sm font-bold text-text-secondary hover:bg-surface-hover transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function TestimonialsClient({ initialQueue }: { initialQueue: ModeratedTestimonial[] }) {
  const [queue, setQueue] = useState(initialQueue);

  async function refresh() {
    setQueue(await getTestimonialQueue());
  }

  async function act(fn: () => Promise<unknown>) {
    await fn();
    await refresh();
  }

  const pending = queue.filter((q) => q.status === "pending").length;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-primary-red">
            moderation{pending > 0 ? ` · ${pending} waiting` : ""}
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-primary md:text-3xl">
            Testimonials
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Member submissions stay invisible until approved. VIP quotes publish instantly, featured.
          </p>
        </div>
        <VipForm onDone={refresh} />
      </div>

      <div className="space-y-3">
        {queue.length === 0 && (
          <div className="bh-card p-10 text-center text-sm text-muted-foreground">
            No testimonials yet — member submissions will appear here.
          </div>
        )}
        {queue.map((item) => (
          <article key={item.id} className="bh-card space-y-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Attribution item={item} />
              <div className="flex items-center gap-2">
                {item.author_type === "maintainer" && (
                  <span className="inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-md bg-surface-hover border border-border text-text-secondary">
                    VIP
                  </span>
                )}
                {item.is_featured && (
                  <Star className="h-3.5 w-3.5 fill-status-yellow text-status-yellow" aria-label="Featured" />
                )}
                <StatusPill status={item.status} />
              </div>
            </div>
            <p className="text-sm text-primary leading-relaxed">{item.comment}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {item.status !== "approved" && (
                <button
                  type="button"
                  onClick={() => act(() => setTestimonialStatus(item.id, "approved"))}
                  className="inline-flex items-center gap-1.5 rounded-full bg-status-green/10 px-4 py-2 text-xs font-bold text-status-green hover:bg-status-green/20 transition-all active:scale-95"
                >
                  <Check className="h-3.5 w-3.5" /> Approve
                </button>
              )}
              {item.status !== "rejected" && (
                <button
                  type="button"
                  onClick={() => act(() => setTestimonialStatus(item.id, "rejected"))}
                  className="inline-flex items-center gap-1.5 rounded-full bg-surface-hover px-4 py-2 text-xs font-bold text-text-secondary hover:bg-surface-hover/70 transition-all active:scale-95"
                >
                  <X className="h-3.5 w-3.5" /> Reject
                </button>
              )}
              <button
                type="button"
                onClick={() => act(() => toggleTestimonialFeatured(item.id, !item.is_featured))}
                className="inline-flex items-center gap-1.5 rounded-full bg-status-yellow/10 px-4 py-2 text-xs font-bold text-status-yellow hover:bg-status-yellow/20 transition-all active:scale-95"
              >
                <Star className="h-3.5 w-3.5" /> {item.is_featured ? "Unfeature" : "Feature"}
              </button>
              <button
                type="button"
                onClick={() => act(() => deleteTestimonial(item.id))}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-primary-red hover:bg-primary-red/10 transition-all active:scale-95"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
