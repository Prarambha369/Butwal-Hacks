"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteTemplate } from "@/lib/actions/certificates";

type TemplateRow = {
  id?: string;
  name?: string;
  event_id?: string | null;
  background_url?: string | null;
  is_default?: boolean;
};

/**
 * Template picker. Delete asks for confirmation, because a template deleted by
 * accident is gone — issued certificates keep rendering from their own
 * recorded field data, but the editable design is not recoverable.
 */
export function TemplateList({
  templates,
  selectedId,
}: {
  templates: TemplateRow[];
  selectedId: string | null;
}) {
  const [busy, startTransition] = useTransition();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  if (templates.length === 0) {
    return (
      <p className="bh-card p-4 text-sm text-muted-foreground">
        No templates yet. The one below becomes your default — you can change that later.
      </p>
    );
  }

  return (
    <div className="bh-card p-4">
      <h2 className="mb-3 text-base font-semibold">Saved templates</h2>
      <ul className="space-y-1">
        {templates.map((t) => {
          const isSelected = t.id === selectedId;
          const isPendingDelete = t.id === pendingDelete;
          return (
            <li
              key={t.id}
              className={`flex flex-wrap items-center gap-2 rounded px-2 py-1.5 ${
                isSelected ? "bg-bh-red-50" : "bg-stone-50"
              }`}
            >
              <Link
                href={`/dashboard/organizer/certificates/templates?template=${t.id}`}
                aria-current={isSelected ? "true" : undefined}
                className="flex-1 text-sm font-medium text-stone-800 underline-offset-2 hover:underline"
              >
                {t.name ?? "Untitled"}
              </Link>

              {t.is_default === true && (
                <span className="rounded bg-stone-900 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                  Default
                </span>
              )}
              <span className="text-xs text-stone-500">
                {t.event_id ? "This event" : "All events"}
              </span>

              {isPendingDelete ? (
                <>
                  <span className="text-xs text-stone-600">Delete?</span>
                  <button
                    type="button"
                    onClick={() =>
                      startTransition(async () => {
                        try {
                          await deleteTemplate(t.id as string);
                        } finally {
                          setPendingDelete(null);
                        }
                      })
                    }
                    disabled={busy}
                    className="rounded bg-bh-red-action px-2 py-0.5 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(null)}
                    className="rounded border border-stone-300 px-2 py-0.5 text-xs"
                  >
                    No
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setPendingDelete(t.id as string)}
                  className="inline-flex min-h-6 items-center rounded px-2 text-xs text-stone-600 hover:bg-stone-200 hover:text-bh-red-600"
                >
                  Delete
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
