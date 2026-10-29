"use client";

import { useState } from "react";
import { Check, Loader2, Plus, Trash2, FileText } from "lucide-react";
import { normaliseTags, toProse } from "@/lib/blog-drafts";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

export interface DraftRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string[];
  tags: string[];
  cover_image: string | null;
  is_published: boolean;
  published_at: string;
  created_at?: string;
}

interface FormState {
  id: string | null;
  title: string;
  excerpt: string;
  body: string;
  tags: string;
  cover_image: string;
}

const EMPTY: FormState = {
  id: null,
  title: "",
  excerpt: "",
  body: "",
  tags: "",
  cover_image: "",
};

function toForm(draft: DraftRow): FormState {
  return {
    id: draft.id,
    title: draft.title,
    excerpt: draft.excerpt,
    body: toProse(draft.body),
    tags: draft.tags.join(", "),
    cover_image: draft.cover_image ?? "",
  };
}

export function BlogDraftClient({ initialDrafts }: { initialDrafts: DraftRow[] }) {
  const [drafts, setDrafts] = useState<DraftRow[]>(initialDrafts);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [draftToDelete, setDraftToDelete] = useState<DraftRow | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const isEditing = form.id !== null;
  const wordCount = form.body.trim().split(/\s+/).filter(Boolean).length;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage(null);
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        ...(form.id ? { id: form.id } : {}),
        title: form.title.trim(),
        excerpt: form.excerpt.trim(),
        body: form.body.trim(),
        tags: normaliseTags(form.tags),
        cover_image: form.cover_image.trim() || null,
      };

      const response = await fetch("/api/blog/drafts", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { draft?: DraftRow; error?: string };
      if (!response.ok || !data.draft) {
        setMessage({ tone: "error", text: data.error ?? "Could not save the draft." });
        return;
      }

      const saved = data.draft;
      setDrafts((current) => {
        const rest = current.filter((draft) => draft.id !== saved.id);
        return [saved, ...rest];
      });
      setForm(toForm(saved));
      setMessage({ tone: "ok", text: form.id ? "Draft updated." : "Draft saved." });
    } catch {
      setMessage({ tone: "error", text: "Network error. Try again." });
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setDeleting(id);
    setMessage(null);
    try {
      const response = await fetch("/api/blog/drafts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok) {
        setMessage({ tone: "error", text: data.error ?? "Could not delete the draft." });
        return;
      }
      setDrafts((current) => current.filter((draft) => draft.id !== id));
      setForm((current) => (current.id === id ? EMPTY : current));
      setMessage({ tone: "ok", text: "Draft deleted." });
    } catch {
      setMessage({ tone: "error", text: "Network error. Try again." });
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <form
        className="space-y-5 rounded-xl border border-border bg-surface p-6"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-primary">
            {isEditing ? "Edit draft" : "New draft"}
          </h2>
          <button
            type="button"
            onClick={() => setForm(EMPTY)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-primary"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            New
          </button>
        </div>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
            Title
          </span>
          <input
            value={form.title}
            onChange={(event) => update("title", event.target.value)}
            maxLength={160}
            placeholder="What did you build, learn, or notice?"
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-primary outline-none placeholder:text-muted-foreground focus:border-primary-red/50 focus:ring-1 focus:ring-primary-red/20"
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
            Summary
          </span>
          <input
            value={form.excerpt}
            onChange={(event) => update("excerpt", event.target.value)}
            maxLength={500}
            placeholder="One sentence that appears in the blog list."
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-primary outline-none placeholder:text-muted-foreground focus:border-primary-red/50 focus:ring-1 focus:ring-primary-red/20"
          />
        </label>

        <label className="block">
          <span className="flex items-baseline justify-between text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
            Body
            <span className="font-mono text-[10px] normal-case tracking-normal">
              {wordCount} words
            </span>
          </span>
          <textarea
            value={form.body}
            onChange={(event) => update("body", event.target.value)}
            rows={14}
            placeholder="Write in plain prose. Leave a blank line between paragraphs."
            className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm leading-relaxed text-primary outline-none placeholder:text-muted-foreground focus:border-primary-red/50 focus:ring-1 focus:ring-primary-red/20"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
              Tags
            </span>
            <input
              value={form.tags}
              onChange={(event) => update("tags", event.target.value)}
              placeholder="community, learning"
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-primary outline-none placeholder:text-muted-foreground focus:border-primary-red/50 focus:ring-1 focus:ring-primary-red/20"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
              Cover image URL
            </span>
            <input
              value={form.cover_image}
              onChange={(event) => update("cover_image", event.target.value)}
              inputMode="url"
              placeholder="https://…"
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-primary outline-none placeholder:text-muted-foreground focus:border-primary-red/50 focus:ring-1 focus:ring-primary-red/20"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-bh-red-action px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-deep-red disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="h-4 w-4" aria-hidden="true" />
            )}
            {isEditing ? "Save changes" : "Save draft"}
          </button>
          {message && (
            <p
              role="status"
              className={cn(
                "text-xs font-semibold",
                message.tone === "ok" ? "text-status-green" : "text-primary-red",
              )}
            >
              {message.text}
            </p>
          )}
        </div>
      </form>

      <aside className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Your drafts ({drafts.length})
        </h2>
        {drafts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Nothing saved yet. Your first draft appears here.
          </p>
        ) : (
          <ul className="space-y-2">
            {drafts.map((draft) => (
              <li
                key={draft.id}
                className={cn(
                  "rounded-xl border p-3 transition-colors",
                  form.id === draft.id
                    ? "border-primary-red/50 bg-primary-red/5"
                    : "border-border bg-surface",
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    setForm(toForm(draft));
                    setMessage(null);
                  }}
                  className="flex w-full items-start gap-2 text-left"
                >
                  <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-primary">
                      {draft.title}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {draft.body.length} paragraph{draft.body.length === 1 ? "" : "s"}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setDraftToDelete(draft)}
                  disabled={deleting === draft.id}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground transition-colors hover:text-primary-red disabled:opacity-50"
                >
                  {deleting === draft.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 className="h-3 w-3" aria-hidden="true" />
                  )}
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {draftToDelete && (
        <ConfirmDialog
          title="Delete draft"
          entityName={draftToDelete.title}
          consequence="The draft is permanently deleted, including its paragraphs, tags, and cover image. This action cannot be undone."
          confirmLabel="Delete draft"
          irreversible
          onConfirm={() => {
            void remove(draftToDelete.id);
          }}
          onClose={() => setDraftToDelete(null)}
        />
      )}
    </div>
  );
}
