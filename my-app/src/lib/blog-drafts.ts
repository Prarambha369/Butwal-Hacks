import { z } from "zod";

/**
 * Shape of a member-authored blog draft.
 *
 * The public table stores paragraphs as a `TEXT[]`, but authors type prose,
 * so the accepted input is a single string and `toParagraphs()` does the
 * conversion. Splitting on blank lines keeps the editing experience plain —
 * no markdown parser, no HTML — which is deliberate: the published post
 * renders the paragraphs as text.
 */

export const DRAFT_LIMITS = {
  title: 160,
  excerpt: 500,
  body: 20_000,
  tags: 12,
  tagLength: 40,
  coverImage: 500,
} as const;

const title = z
  .string()
  .trim()
  .min(4, "Give the draft a title of at least 4 characters.")
  .max(DRAFT_LIMITS.title);

const body = z
  .string()
  .trim()
  .min(20, "Write at least a couple of sentences.")
  .max(DRAFT_LIMITS.body);

const tags = z
  .array(z.string().trim().min(1).max(DRAFT_LIMITS.tagLength))
  .max(DRAFT_LIMITS.tags);

const tagsWithDefault = tags.optional().default([]);

const coverImage = z
  .url()
  .max(DRAFT_LIMITS.coverImage)
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

const coverImageNullable = z
  .union([z.url().max(DRAFT_LIMITS.coverImage), z.null()])
  .transform((value) => (value === null ? null : value));

export const draftCreateSchema = z.object({
  title,
  excerpt: z.string().trim().max(DRAFT_LIMITS.excerpt).optional().default(""),
  body,
  tags: tagsWithDefault,
  cover_image: coverImage,
});

export const draftUpdateSchema = z.object({
  id: z.uuid(),
  title: title.optional(),
  excerpt: z.string().trim().max(DRAFT_LIMITS.excerpt).optional(),
  body: body.optional(),
  tags: tags.optional(),
  cover_image: coverImageNullable.optional(),
});

export const draftDeleteSchema = z.object({
  id: z.uuid(),
});

export type DraftCreateInput = z.infer<typeof draftCreateSchema>;
export type DraftUpdateInput = z.infer<typeof draftUpdateSchema>;

/** Prose → paragraphs. Blank lines separate; empty blocks are dropped. */
export function toParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 200);
}

/** Paragraphs → editable prose, for loading a draft into the form. */
export function toProse(paragraphs: readonly string[] | null | undefined): string {
  return (paragraphs ?? []).join("\n\n");
}

/** Normalise a free-form tag field ("nepal, Learning ") into the stored shape. */
export function normaliseTags(input: string | readonly string[]): string[] {
  const raw = typeof input === "string" ? input.split(",") : input;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of raw) {
    const tag = value.trim().toLowerCase().slice(0, DRAFT_LIMITS.tagLength);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
    if (out.length >= DRAFT_LIMITS.tags) break;
  }
  return out;
}
