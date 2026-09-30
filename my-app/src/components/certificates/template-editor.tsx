"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BUILTIN_TOKENS,
  FONT_FAMILIES,
  cssFontFor,
  isLatinEncodable,
  normaliseTemplate,
  type CertificateTemplate,
  type FieldAlign,
  type NormalisedTemplate,
  type TemplateField,
} from "@/lib/certificates/template";
import { saveTemplate } from "@/lib/actions/certificates";

/**
 * Visual certificate template editor.
 *
 * Positions are stored normalised 0..1, so this canvas is just a view: the
 * same template renders at any page size without the field moving.
 *
 * Drag has a keyboard equivalent (arrow keys nudge, shift for coarse). The
 * repo's other drag surface, `image-crop-dialog.tsx`, has pointer dragging
 * only, which means a keyboard user cannot move anything there at all; that
 * is not a pattern worth propagating to an authoring tool.
 */

const CANVAS_W = 1056;
const CANVAS_H = 816;

// Wording matches defaultFields() in lib/certificates/template.ts. Two
// vocabularies for the same field would mean the editor relabels a template
// the moment someone opens it.
const TOKEN_LABELS: Record<string, string> = {
  name: "Recipient name",
  title: "Achievement title",
  date: "Issue date",
  email: "Email address",
  bh_id: "Butwal Hacks ID",
  event: "Event name",
};

// Derived from the module's BUILTIN_TOKENS so a new builtin cannot ship
// without appearing in the editor.
const TOKEN_CHOICES = BUILTIN_TOKENS.map((t) => ({
  token: t,
  label: TOKEN_LABELS[t] ?? t,
}));

const FONTS = FONT_FAMILIES;
const COLORS = ["#1c1917", "#0f766e", "#b91c1c", "#1e3a8a", "#ffffff", "#78350f"];

const SAMPLES: Record<string, string> = {
  name: "Asha Sharma",
  title: "Certificate of Participation",
  date: "January 8, 2026",
  bh_id: "bh-0123",
  event: "Build In Public 2026",
};

/**
 * Editor canvas -> CSS pixels.
 *
 * `fontSize` is a fraction of page WIDTH, not height, so it scales with the
 * page in the same way the artwork does. A landscape page therefore has
 * smaller-looking type than a portrait one at the same fontSize, which is
 * correct: the fraction is of the width that carries the line.
 */
function toPixels(field: TemplateField, pageWidth: number, pageHeight: number) {
  const size = Math.max(6, field.fontSize * pageWidth);
  // The renderer anchors on the alignment point: x is the left edge for
  // "left", the centre for "center", the right edge for "right". An
  // absolutely-positioned shrink-to-fit box has no width for text-align to act
  // on, so the preview has to apply the same shift explicitly. Without this
  // every centred field -- which is all of them, by default -- previewed half
  // its width to the right of the printed position.
  const shift = field.align === "center" ? "-50%" : field.align === "right" ? "-100%" : "0%";
  return {
    left: field.x * pageWidth,
    top: field.y * pageHeight,
    fontSize: size,
    transform: `translateX(${shift}) rotate(${field.rotation}deg)`,
    // Honour the field's own width so the preview wraps where the PDF shrinks.
    maxWidth: field.width ? field.width * 100 : undefined,
  };
}

export default function CertificateTemplateEditor({
  template: initial,
  eventId,
  eventOptions,
}: {
  /**
   * A raw database row or editor payload, not a pre-typed object. Letting
   * `normaliseTemplate` do the coercion is the point: a template row edited
   * outside the app can have a bad field and should degrade, not crash the
   * page that renders it.
   */
  template?: Record<string, unknown> | null;
  eventId?: string | null;
  eventOptions?: Array<{ id: string; title: string }>;
}) {
  const router = useRouter();
  const [tpl, setTpl] = useState<NormalisedTemplate>(() =>
    normaliseTemplate(
      initial
        ? { ...initial, eventId: eventId ?? initial.eventId ?? null }
        : { eventId: eventId ?? null },
    ),
  );
  const [selected, setSelected] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState<"idle" | "saved" | "error">("idle");
  const canvasRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ token: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  const fields = useMemo(() => tpl.fields, [tpl.fields]);
  const field = fields[selected];

  const patch = useCallback((next: Partial<TemplateField>) => {
    setTpl((t) => ({ ...t, fields: t.fields.map((f, i) => (i === selected ? { ...f, ...next } : f)) }));
    setSaved("idle");
  }, [selected]);

  const patchAll = useCallback((next: Partial<CertificateTemplate>) => {
    setTpl((t) => ({ ...t, ...next }));
    setSaved("idle");
  }, []);

  // ── Pointer drag ────────────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent, index: number) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const f = tpl.fields[index];
    drag.current = { token: f.token, startX: e.clientX, startY: e.clientY, origX: f.x, origY: f.y };
    setSelected(index);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const box = canvasRef.current?.getBoundingClientRect();
    if (!d || !box) return;
    // Divide by the rendered box so movement tracks the cursor regardless of
    // how the canvas is scaled by the viewport.
    const dx = (e.clientX - d.startX) / box.width;
    const dy = (e.clientY - d.startY) / box.height;
    setTpl((t) => ({
      ...t,
      fields: t.fields.map((f) =>
        f.token === d.token
          ? { ...f, x: clamp01(d.origX + dx), y: clamp01(d.origY + dy) }
          : f,
      ),
    }));
  };

  const endDrag = (e: React.PointerEvent) => {
    if (drag.current) {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    }
    drag.current = null;
    setSaved("idle");
  };

  // ── Keyboard: the accessible path to the same outcome ───────────────────
  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const step = e.shiftKey ? 0.01 : 0.002;
    const f = tpl.fields[index];
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    if (e.key in moves) {
      e.preventDefault();
      const [mx, my] = moves[e.key];
      patch({ x: clamp01(f.x + mx), y: clamp01(f.y + my) });
    } else if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      removeField(index);
    }
  };

  const addField = () => {
    const token = `field_${fields.length + 1}`;
    setTpl((t) => ({
      ...t,
      fields: [
        ...t.fields,
        { ...t.fields[0], id: token, token, label: "Custom field", x: 0.1, y: 0.5 },
      ],
    }));
    setSelected(fields.length);
    setSaved("idle");
  };

  const removeField = (index: number) => {
    setTpl((t) => ({ ...t, fields: t.fields.filter((_, i) => i !== index) }));
    setSelected((s) => Math.max(0, Math.min(s, fields.length - 2)));
    setSaved("idle");
  };

  const moveOrder = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    setTpl((t) => ({ ...t, fields: next }));
    setSelected(target);
    setSaved("idle");
  };

  const onSave = () => {
    setSaved("idle");
    startTransition(async () => {
      try {
        await saveTemplate({
          id: tpl.id || undefined,
          eventId: tpl.eventId ?? null,
          name: tpl.name,
          backgroundUrl: tpl.backgroundUrl,
          pageWidth: tpl.pageWidth,
          pageHeight: tpl.pageHeight,
          fields: tpl.fields,
          isDefault: tpl.isDefault,
        });
        setSaved("saved");
        router.refresh();
      } catch {
        setSaved("error");
      }
    });
  };

  const unsupported = field ? !isLatinEncodable(SAMPLES[field.token] ?? "") : false;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* ── Canvas ── */}
      <div>
        <div
          ref={canvasRef}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="relative w-full touch-none select-none overflow-hidden rounded-lg border border-stone-300 bg-white shadow-sm"
          style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
        >
          {tpl.backgroundUrl ? (
            // Plain <img>, not next/image: the background is a user-typed
            // URL, so a host outside next.config's remotePatterns would
            // hard-fail the editor instead of previewing it. A broken preview
            // is recoverable; a 400 from the optimiser is not.
            // Decorative only -- the field list in the sidebar is the
            // accessible equivalent, so alt stays empty.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tpl.backgroundUrl}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="absolute inset-0 h-full w-full object-contain"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-sm text-stone-400">
              No background uploaded
            </div>
          )}

          {fields.map((f, i) => {
            const pos = toPixels(f, CANVAS_W, CANVAS_H);
            const isSel = i === selected;
            return (
              <button
                key={f.token}
                type="button"
                onPointerDown={(e) => onPointerDown(e, i)}
                onKeyDown={(e) => onKeyDown(e, i)}
                onFocus={() => setSelected(i)}
                aria-label={`${f.label} field, ${isSel ? "selected" : "not selected"}. Arrow keys to move, delete to remove.`}
                className={`absolute cursor-move rounded border-2 text-left ${
                  isSel ? "border-bh-red-500 bg-bh-red-500/10" : "border-transparent hover:border-bh-red-500/50"
                }`}
                style={{
                  left: pos.left,
                  top: pos.top,
                  fontSize: pos.fontSize,
                  color: f.color,
                  ...(() => {
                    const css = cssFontFor(f);
                    return { fontFamily: css.family, fontWeight: css.weight, fontStyle: css.style };
                  })(),
                  // The box shrinks to the text, so text-align has nothing to
                  // align within; the anchor shift lives in toPixels.
                  textAlign: "left",
                  transform: pos.transform,
                }}
              >
                {SAMPLES[f.token] ?? f.token}
              </button>
            );
          })}
        </div>

        <p className="mt-2 text-xs text-stone-500">
          Drag a field, or focus it and use the arrow keys (hold Shift for larger steps). Press Delete to
          remove it.
        </p>
      </div>

      {/* ── Sidebar ── */}
      <aside className="space-y-5">
        <div className="space-y-3 rounded-lg border border-stone-200 p-4">
          <h2 className="text-sm font-semibold text-stone-900">Template</h2>
          <div>
            <label htmlFor="tpl-name" className="mb-1 block text-xs font-medium text-stone-600">
              Name
            </label>
            <input
              id="tpl-name"
              value={tpl.name}
              onChange={(e) => patchAll({ name: e.target.value })}
              className="w-full rounded border border-stone-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="tpl-scope" className="mb-1 block text-xs font-medium text-stone-600">
              Applies to
            </label>
            <select
              id="tpl-scope"
              value={tpl.eventId ?? ""}
              onChange={(e) => patchAll({ eventId: e.target.value || null })}
              className="w-full rounded border border-stone-300 px-2 py-1.5 text-sm"
            >
              <option value="">All events (organisation default)</option>
              {(eventOptions ?? []).map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tpl-bg" className="mb-1 block text-xs font-medium text-stone-600">
              Background image URL
            </label>
            <input
              id="tpl-bg"
              value={tpl.backgroundUrl ?? ""}
              onChange={(e) => patchAll({ backgroundUrl: e.target.value })}
              placeholder="Cloudinary URL from the upload above"
              className="w-full rounded border border-stone-300 px-2 py-1.5 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={tpl.isDefault === true}
              onChange={(e) => patchAll({ isDefault: e.target.checked })}
            />
            Use as the default template
          </label>
        </div>

        <div className="space-y-3 rounded-lg border border-stone-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-900">Fields</h2>
            <button
              type="button"
              onClick={addField}
              className="rounded bg-stone-900 px-2 py-1 text-xs font-medium text-white"
            >
              Add
            </button>
          </div>

          <ul className="space-y-1">
            {fields.map((f, i) => (
              <li key={f.token}>
                <div
                  className={`flex items-center gap-1 rounded px-1 ${i === selected ? "bg-bh-red-50" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => setSelected(i)}
                    aria-current={i === selected}
                    className="flex-1 truncate py-1 text-left text-sm text-stone-700"
                  >
                    {f.label}
                    <span className="ml-1 text-xs text-stone-400">({f.token})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveOrder(i, -1)}
                    disabled={i === 0}
                    aria-label={`Move ${f.label} up`}
                    className="px-1 text-stone-500 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveOrder(i, 1)}
                    disabled={i === fields.length - 1}
                    aria-label={`Move ${f.label} down`}
                    className="px-1 text-stone-500 disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeField(i)}
                    disabled={fields.length <= 1}
                    aria-label={`Remove ${f.label}`}
                    className="px-1 text-bh-red-600 disabled:opacity-30"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {field && (
          <div className="space-y-3 rounded-lg border border-stone-200 p-4">
            <h2 className="text-sm font-semibold text-stone-900">Selected field</h2>

            <div>
              <label htmlFor="f-token" className="mb-1 block text-xs font-medium text-stone-600">
                Content
              </label>
              <select
                id="f-token"
                value={TOKEN_CHOICES.some((t) => t.token === field.token) ? field.token : "custom"}
                onChange={(e) => {
                  const choice = TOKEN_CHOICES.find((t) => t.token === e.target.value);
                  patch(choice ? { token: choice.token, label: choice.label } : {});
                }}
                className="w-full rounded border border-stone-300 px-2 py-1.5 text-sm"
              >
                {TOKEN_CHOICES.map((t) => (
                  <option key={t.token} value={t.token}>
                    {t.label}
                  </option>
                ))}
                {!TOKEN_CHOICES.some((t) => t.token === field.token) && (
                  <option value="custom">Custom ({field.token})</option>
                )}
              </select>
            </div>

            <div>
              <label htmlFor="f-size" className="mb-1 block text-xs font-medium text-stone-600">
                Size — {Math.round(field.fontSize * CANVAS_W)}px on a 1056px-wide page
              </label>
              <input
                id="f-size"
                type="range"
                min={0.01}
                max={0.16}
                step={0.002}
                value={field.fontSize}
                onChange={(e) => patch({ fontSize: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <span className="mb-1 block text-xs font-medium text-stone-600">Colour</span>
              <div className="flex flex-wrap gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => patch({ color: c })}
                    aria-label={`Colour ${c}`}
                    aria-pressed={field.color === c}
                    className={`h-7 w-7 rounded border-2 ${field.color === c ? "border-stone-900" : "border-stone-300"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="f-font" className="mb-1 block text-xs font-medium text-stone-600">
                  Font
                </label>
                <select
                  id="f-font"
                  value={field.fontFamily}
                  onChange={(e) => patch({ fontFamily: e.target.value })}
                  className="w-full rounded border border-stone-300 px-2 py-1.5 text-sm"
                >
                  {FONTS.map((f) => (
                    <option key={f} value={f}>
                      {f === "Times-Roman" ? "Times" : f === "Helvetica" ? "Sans" : "Monospace"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="f-align" className="mb-1 block text-xs font-medium text-stone-600">
                  Align
                </label>
                <select
                  id="f-align"
                  value={field.align}
                  onChange={(e) => patch({ align: e.target.value as FieldAlign })}
                  className="w-full rounded border border-stone-300 px-2 py-1.5 text-sm"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={field.bold === true}
                  onChange={(e) => patch({ bold: e.target.checked || undefined })}
                />
                Bold
              </label>
              <label className="flex items-center gap-1.5 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={field.italic === true}
                  onChange={(e) => patch({ italic: e.target.checked || undefined })}
                />
                Italic
              </label>
            </div>

            {unsupported && (
              <p className="rounded bg-amber-50 p-2 text-xs text-amber-900">
                This renderer uses standard PDF fonts, which cannot shape Devanagari. Values outside
                Latin-1 will print as <code>?</code> and generate a warning on download. Transliterate
                the name field to English, or use a canvas-based renderer.
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSave}
            disabled={isPending}
            className="rounded bg-bh-red-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Save template"}
          </button>
          {saved === "saved" && (
            <span role="status" className="text-sm text-teal-700">
              Saved
            </span>
          )}
          {saved === "error" && (
            <span role="alert" className="text-sm text-bh-red-600">
              Could not save. Check you still have the organiser or maintainer role.
            </span>
          )}
        </div>
      </aside>
    </div>
  );
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, Number(v.toFixed(4))));
}
