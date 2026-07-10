/** ponytail: Read limit/offset from URL params, clamped safe. */
export function parsePagination(req: Request, defaultLimit = 50) {
  const u = new URL(req.url)
  const l = parseInt(u.searchParams.get("limit") ?? "", 10)
  const o = parseInt(u.searchParams.get("offset") ?? "", 10)
  return {
    limit: Number.isFinite(l) ? Math.min(200, Math.max(1, l)) : defaultLimit,
    offset: Number.isFinite(o) ? Math.max(0, o) : 0,
  }
}

/** ponytail: hasMore = returned ≥ limit means there may be another page. */
export function paginationMeta(limit: number, offset: number, count: number) {
  return { limit, offset, hasMore: count >= limit }
}
