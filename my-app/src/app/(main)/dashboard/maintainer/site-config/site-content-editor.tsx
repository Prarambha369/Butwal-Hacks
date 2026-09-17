"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { setSiteContent } from "@/lib/actions/site-content";
import type {
  EditableKey,
  LocalizedText,
} from "@/lib/site-content-keys";

function KeyEditor({
  entry,
  initial,
  onSaved,
}: {
  entry: EditableKey;
  initial: LocalizedText | null;
  onSaved: (key: string, value: LocalizedText) => void;
}) {
  const [en, setEn] = useState(initial?.en ?? "");
  const [ne, setNe] = useState(initial?.ne ?? "");
  const [saving, setSaving] = useState(false);
  const [savedTick, setSavedTick] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = en !== (initial?.en ?? "") || ne !== (initial?.ne ?? "");

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await setSiteContent(entry.key, { en, ne });
      onSaved(entry.key, { en: en.trim(), ne: ne.trim() });
      setSavedTick(true);
      setTimeout(() => setSavedTick(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bh-card space-y-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-primary">{entry.label}</p>
          <p className="font-mono text-[11px] text-muted-foreground">{entry.key}</p>
        </div>
        {savedTick && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-status-green">
            <Check className="h-3.5 w-3.5" /> Saved
          </span>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            English
          </span>
          <textarea
            value={en}
            onChange={(e) => setEn(e.target.value)}
            rows={3}
            placeholder="Empty = default text"
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-primary placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary-red/40"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Nepali
          </span>
          <textarea
            value={ne}
            onChange={(e) => setNe(e.target.value)}
            rows={3}
            placeholder="Empty = default text"
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-primary placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary-red/40"
          />
        </label>
      </div>
      {error && (
        <p className="text-sm text-primary-red" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={save}
        disabled={saving || !dirty}
        className="bh-btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

export default function SiteContentEditor({
  keys,
  initialValues,
}: {
  keys: EditableKey[];
  initialValues: Record<string, LocalizedText | null>;
}) {
  const [values, setValues] = useState(initialValues);

  return (
    <div className="space-y-4">
      {keys.map((entry) => (
        <KeyEditor
          key={entry.key}
          entry={entry}
          initial={values[entry.key] ?? null}
          onSaved={(key, value) => setValues((v) => ({ ...v, [key]: value }))}
        />
      ))}
    </div>
  );
}
