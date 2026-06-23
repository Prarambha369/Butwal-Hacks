import { z } from "zod";

/** Zod schema for pagination query params. Reusable across all list endpoints. */
export const PaginationSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((v) => {
      const n = parseInt(v ?? "", 10);
      return Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    }),
  offset: z
    .string()
    .optional()
    .transform((v) => {
      const n = parseInt(v ?? "", 10);
      return Number.isFinite(n) ? Math.max(0, n) : 0;
    }),
});

export type PaginationParams = z.infer<typeof PaginationSchema>;

/**
 * Extract and validate pagination params from a request URL.
 * Uses Zod schema for type safety. Clamps limit to 1-200, offset to ≥0.
 */
export function parsePagination(req: Request): PaginationParams {
  const u = new URL(req.url);
  const raw = { limit: u.searchParams.get("limit") ?? undefined, offset: u.searchParams.get("offset") ?? undefined };
  return PaginationSchema.parse(raw);
}

/** ponytail: hasMore = returned ≥ limit means there may be another page. */
export function paginationMeta(limit: number, offset: number, count: number) {
  return { limit, offset, hasMore: count >= limit }
}
