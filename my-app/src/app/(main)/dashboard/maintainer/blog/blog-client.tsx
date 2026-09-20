"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import {
  savePost,
  deletePost,
  type BlogRow,
} from "@/lib/actions/blog";

const emptyForm = {
  title: "", slug: "", excerpt: "", body: "", tags: "",
  cover_image: "", published_at: "", is_published: false,
};

export function BlogClient({ initialPosts }: { initialPosts: BlogRow[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const { getAllPosts } = await import("@/lib/actions/blog");
    try {
      setPosts(await getAllPosts());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reload");
    }
  }

  function startAdd() {
    setEditingId("new");
    setForm({ ...emptyForm, published_at: new Date().toISOString().slice(0, 10) });
    setError(null);
  }

  function startEdit(p: BlogRow) {
    setEditingId(p.id);
    setForm({
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      body: p.body.join("\n\n"),
      tags: p.tags.join(", "),
      cover_image: p.cover_image ?? "",
      published_at: p.published_at.slice(0, 10),
      is_published: p.is_published,
    });
    setError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await savePost({
        id: editingId === "new" ? undefined : (editingId ?? undefined),
        title: form.title,
        slug: form.slug || form.title,
        excerpt: form.excerpt,
        body: form.body.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean),
        tags: form.tags.split(","),
        cover_image: form.cover_image || null,
        published_at: form.published_at,
        is_published: form.is_published,
      });
      setEditingId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this post?")) return;
    setBusy(true);
    try {
      await deletePost(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setBusy(false);
    }
  }

  const set = (k: keyof typeof emptyForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary-red";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
          Body paragraphs are separated by a blank line. Uncheck published to keep a draft.
        </p>
        <button onClick={startAdd} className="inline-flex items-center gap-1.5 rounded-full bg-primary-red px-4 py-2 text-xs font-bold text-white hover:bg-deep-red transition-all">
          <Plus className="w-3.5 h-3.5" /> New post
        </button>
      </div>
      {error && <p className="text-sm text-primary-red" role="alert">{error}</p>}

      <div className="space-y-2">
        {posts.map((p) => (
          <div key={p.id} className="bh-card flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="font-bold text-primary truncate">{p.title}</p>
              <p className="text-xs text-muted-foreground font-mono">
                /{p.slug} · {p.published_at.slice(0, 10)} · {p.is_published ? "live" : "draft"}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button onClick={() => startEdit(p)} className="bh-icon-btn !min-w-[36px] !min-h-[36px]" aria-label={`Edit ${p.title}`}>
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => remove(p.id)} className="bh-icon-btn !min-w-[36px] !min-h-[36px]" aria-label={`Delete ${p.title}`}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {posts.length === 0 && !editingId && (
          <p className="text-sm text-muted-foreground">No posts in the database yet. The public blog shows the built-in posts.</p>
        )}
      </div>

      {editingId && (
        <form onSubmit={save} className="bh-card space-y-3 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-muted-foreground sm:col-span-2">Title<input required value={form.title} onChange={set("title")} className={input} /></label>
            <label className="text-xs font-bold text-muted-foreground">Slug<input required value={form.slug} onChange={set("slug")} className={input} placeholder="auto from title" /></label>
            <label className="text-xs font-bold text-muted-foreground">Published on<input type="date" value={form.published_at} onChange={set("published_at")} className={input} /></label>
            <label className="text-xs font-bold text-muted-foreground sm:col-span-2">Excerpt<textarea rows={2} value={form.excerpt} onChange={set("excerpt")} className={input} /></label>
            <label className="text-xs font-bold text-muted-foreground sm:col-span-2">Body (blank line between paragraphs)<textarea rows={10} value={form.body} onChange={set("body")} className={input} /></label>
            <label className="text-xs font-bold text-muted-foreground">Tags (comma separated)<input value={form.tags} onChange={set("tags")} className={input} placeholder="community, events" /></label>
            <label className="text-xs font-bold text-muted-foreground">Cover image (https)<input value={form.cover_image} onChange={set("cover_image")} className={input} /></label>
            <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <input type="checkbox" checked={form.is_published} onChange={set("is_published")} className="h-4 w-4 accent-primary-red" /> Published
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 rounded-full bg-primary-red px-5 py-2 text-xs font-bold text-white hover:bg-deep-red transition-all disabled:opacity-50">
              <Check className="w-3.5 h-3.5" /> Save
            </button>
            <button type="button" onClick={() => setEditingId(null)} className="inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2 text-xs font-bold text-muted-foreground hover:text-primary transition-all">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
