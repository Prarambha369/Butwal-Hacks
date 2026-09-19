"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import {
  savePartner,
  deletePartner,
  type Partner,
} from "@/lib/actions/partners";

const emptyForm = { name: "", logo_url: "", href: "", sort_order: 0, is_active: true };

export function PartnersClient({ initialPartners }: { initialPartners: Partner[] }) {
  const [partners, setPartners] = useState(initialPartners);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const { getAllPartners } = await import("@/lib/actions/partners");
    try {
      setPartners(await getAllPartners());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reload");
    }
  }

  function startAdd() {
    setEditingId("new");
    setForm(emptyForm);
    setError(null);
  }

  function startEdit(p: Partner) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      logo_url: p.logo_url ?? "",
      href: p.href ?? "",
      sort_order: p.sort_order,
      is_active: p.is_active,
    });
    setError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await savePartner({
        id: editingId === "new" ? undefined : (editingId ?? undefined),
        name: form.name,
        logo_url: form.logo_url || null,
        href: form.href || null,
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

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
        These logos appear on the homepage wall. Only add partners with a real
        relationship — no placeholders. Uncheck active to hide without deleting.
        Logo and link must be https URLs.
      </p>
      {error && <p className="text-sm text-primary-red" role="alert">{error}</p>}

      {partners.length === 0 && !editingId && (
        <p className="text-sm text-muted-foreground">
          No partners yet. The homepage wall stays hidden until you add one.
        </p>
      )}

      <div className="grid gap-3">
        {partners.map((p) => (
          <div key={p.id} className="bh-card flex items-center gap-3 p-4">
            {p.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.logo_url} alt="" className="h-8 w-8 rounded object-contain" loading="lazy" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded bg-surface-hover text-xs font-bold text-muted-foreground">
                {p.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-primary">
                {p.name}
                {!p.is_active && (
                  <span className="ml-2 text-[11px] font-semibold text-muted-foreground">(hidden)</span>
                )}
              </p>
              <p className="truncate text-xs text-muted-foreground">order {p.sort_order}</p>
            </div>
            <button type="button" onClick={() => startEdit(p)} aria-label={`Edit ${p.name}`}
              className="rounded-lg border border-border p-2 text-muted-foreground hover:text-primary hover:bg-surface-hover">
              <Pencil className="h-4 w-4" />
            </button>
            <button type="button"
              onClick={() => { if (confirm(`Remove ${p.name} from the wall?`)) deletePartner(p.id).then(refresh).catch((e) => setError(e instanceof Error ? e.message : "Delete failed")); }}
              aria-label={`Delete ${p.name}`}
              className="rounded-lg border border-border p-2 text-muted-foreground hover:text-primary-red hover:bg-surface-hover">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {!editingId ? (
        <button type="button" onClick={startAdd}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-bold text-primary hover:bg-surface-hover">
          <Plus className="h-4 w-4" /> Add partner
        </button>
      ) : (
        <form onSubmit={save} className="bh-card space-y-4 p-6">
          <h3 className="text-base font-bold text-primary">
            {editingId === "new" ? "New partner" : "Edit partner"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-bold text-primary">Name *</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                required maxLength={120} placeholder="GitHub Education"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary-red/40" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-bold text-primary">Order (lowest first)</span>
              <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary-red/40" />
            </label>
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="font-bold text-primary">Logo URL (https, optional — initials show otherwise)</span>
              <input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                placeholder="https://…" inputMode="url"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary-red/40" />
            </label>
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="font-bold text-primary">Link URL (https, optional)</span>
              <input value={form.href} onChange={(e) => setForm({ ...form, href: e.target.value })}
                placeholder="https://…" inputMode="url"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary-red/40" />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-primary">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active (visible on homepage)
          </label>
          <div className="flex items-center gap-2">
            <button type="submit" disabled={busy}
              className="inline-flex items-center gap-1 rounded-full bg-primary-red px-5 py-2 text-sm font-bold text-white hover:bg-deep-red disabled:opacity-50">
              <Check className="h-4 w-4" /> {busy ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => setEditingId(null)}
              className="inline-flex items-center gap-1 rounded-full border border-border px-5 py-2 text-sm font-bold text-primary hover:bg-surface-hover">
              <X className="h-4 w-4" /> Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
