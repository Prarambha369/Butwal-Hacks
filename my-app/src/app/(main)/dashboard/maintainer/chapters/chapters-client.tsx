"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import {
  saveChapter,
  deleteChapter,
  type ChapterRow,
} from "@/lib/actions/chapters";

const emptyForm = {
  name: "", slug: "", school: "", lead_name: "", city: "",
  district: "Rupandehi", status: "active", established: "",
  member_count: 0, description: "", highlights: "", whatsapp: "",
  sort_order: 0, is_active: true,
};

export function ChaptersClient({ initialChapters }: { initialChapters: ChapterRow[] }) {
  const [chapters, setChapters] = useState(initialChapters);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const { getAllChapters } = await import("@/lib/actions/chapters");
    try {
      setChapters(await getAllChapters());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reload");
    }
  }

  function startAdd() {
    setEditingId("new");
    setForm(emptyForm);
    setError(null);
  }

  function startEdit(c: ChapterRow) {
    setEditingId(c.id);
    setForm({
      name: c.name,
      slug: c.slug,
      school: c.school,
      lead_name: c.lead_name,
      city: c.city,
      district: c.district,
      status: c.status,
      established: c.established,
      member_count: c.member_count,
      description: c.description,
      highlights: c.highlights.join("\n"),
      whatsapp: c.whatsapp ?? "",
      sort_order: c.sort_order,
      is_active: c.is_active,
    });
    setError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await saveChapter({
        id: editingId === "new" ? undefined : (editingId ?? undefined),
        name: form.name,
        slug: form.slug || form.name,
        school: form.school,
        lead_name: form.lead_name,
        city: form.city,
        district: form.district,
        status: form.status,
        established: form.established,
        member_count: Number(form.member_count) || 0,
        description: form.description,
        highlights: form.highlights.split("\n"),
        whatsapp: form.whatsapp || null,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
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
    if (!confirm("Delete this chapter?")) return;
    setBusy(true);
    try {
      await deleteChapter(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setBusy(false);
    }
  }

  const set = (k: keyof typeof emptyForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary-red";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
          School chapters on the public page. Uncheck active to hide without deleting.
        </p>
        <button onClick={startAdd} className="inline-flex items-center gap-1.5 rounded-full bg-primary-red px-4 py-2 text-xs font-bold text-white hover:bg-deep-red transition-all">
          <Plus className="w-3.5 h-3.5" /> Add chapter
        </button>
      </div>
      {error && <p className="text-sm text-primary-red" role="alert">{error}</p>}

      <div className="space-y-2">
        {chapters.map((c) => (
          <div key={c.id} className="bh-card flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="font-bold text-primary truncate">{c.name}</p>
              <p className="text-xs text-muted-foreground font-mono">
                /{c.slug} · {c.status} · {c.is_active ? "visible" : "hidden"}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button onClick={() => startEdit(c)} className="bh-icon-btn !min-w-[36px] !min-h-[36px]" aria-label={`Edit ${c.name}`}>
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => remove(c.id)} className="bh-icon-btn !min-w-[36px] !min-h-[36px]" aria-label={`Delete ${c.name}`}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {chapters.length === 0 && !editingId && (
          <p className="text-sm text-muted-foreground">No chapters in the database yet. The public page shows the built-in list.</p>
        )}
      </div>

      {editingId && (
        <form onSubmit={save} className="bh-card space-y-3 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-muted-foreground">Name<input required value={form.name} onChange={set("name")} className={input} /></label>
            <label className="text-xs font-bold text-muted-foreground">Slug<input required value={form.slug} onChange={set("slug")} className={input} placeholder="auto from name" /></label>
            <label className="text-xs font-bold text-muted-foreground">School<input value={form.school} onChange={set("school")} className={input} /></label>
            <label className="text-xs font-bold text-muted-foreground">Lead name<input value={form.lead_name} onChange={set("lead_name")} className={input} /></label>
            <label className="text-xs font-bold text-muted-foreground">City<input value={form.city} onChange={set("city")} className={input} /></label>
            <label className="text-xs font-bold text-muted-foreground">District<input value={form.district} onChange={set("district")} className={input} /></label>
            <label className="text-xs font-bold text-muted-foreground">Status
              <select value={form.status} onChange={set("status")} className={input}>
                <option value="active">Active</option>
                <option value="forming">Forming</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <label className="text-xs font-bold text-muted-foreground">Established<input value={form.established} onChange={set("established")} className={input} placeholder="2025" /></label>
            <label className="text-xs font-bold text-muted-foreground">Members<input type="number" min={0} value={form.member_count} onChange={set("member_count")} className={input} /></label>
            <label className="text-xs font-bold text-muted-foreground">Sort order<input type="number" value={form.sort_order} onChange={set("sort_order")} className={input} /></label>
            <label className="text-xs font-bold text-muted-foreground sm:col-span-2">Description<textarea rows={3} value={form.description} onChange={set("description")} className={input} /></label>
            <label className="text-xs font-bold text-muted-foreground sm:col-span-2">Highlights (one per line)<textarea rows={4} value={form.highlights} onChange={set("highlights")} className={input} /></label>
            <label className="text-xs font-bold text-muted-foreground sm:col-span-2">WhatsApp link (https)<input value={form.whatsapp} onChange={set("whatsapp")} className={input} placeholder="https://chat.whatsapp.com/..." /></label>
            <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <input type="checkbox" checked={form.is_active} onChange={set("is_active")} className="h-4 w-4 accent-primary-red" /> Visible on site
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
