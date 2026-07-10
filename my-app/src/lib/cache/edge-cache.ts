/**
 * edge-cache — Upstash Redis edge caching for profile pages.
 *
 * Caches Supabase query results in Upstash Redis to reduce database load
 * and improve response times for high-traffic public profile pages (/p/[slug_id]).
 *
 * Cache strategy:
 *   - TTL: 60 seconds (profiles change infrequently)
 *   - Invalidation: On profile update (via server action)
 *   - Key pattern: `bh:cache:profile:{slug_id}`
 *
 * ponytail: Direct Upstash Redis REST API — no SDK needed beyond the existing
 * Upstash Redis client. Upgrade path: Add stale-while-revalidate pattern.
 *
 * Usage:
 *   import { getCachedProfile, setCachedProfile, invalidateProfileCache } from "@/lib/cache/edge-cache"
 *
 *   const profile = await getCachedProfile(slugId) ?? await fetchAndCacheProfile(slugId)
 */

import { Redis } from "@upstash/redis";

const CACHE_TTL = 60; // seconds — profiles change infrequently

// ponytail: Silent fallback — if Redis is not configured, cache is a no-op.
function getClient(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL) return null;
  try {
    return Redis.fromEnv();
  } catch {
    return null;
  }
}

/**
 * Profile data cached in Redis.
 * Matches the shape returned by the profiles table SELECT.
 */
export interface CachedProfile {
  id: string;
  bh_id: string | null;
  slug_id: string | null;
  full_name: string | null;
  email: string | null;
  role: string | null;
  xp: number | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  skills: string[] | null;
  github_username: string | null;
  is_claimed: boolean;
  created_at: string;
}

function cacheKey(slugId: string): string {
  return `bh:cache:profile:${slugId}`;
}

/**
 * Get cached profile data.
 * Returns null on cache miss or if Redis is unavailable.
 */
export async function getCachedProfile(slugId: string): Promise<CachedProfile | null> {
  const redis = getClient();
  if (!redis) return null;

  try {
    const data = await redis.get<CachedProfile>(cacheKey(slugId));
    return data;
  } catch {
    return null;
  }
}

/**
 * Store profile data in cache.
 * Returns true if cached successfully, false if Redis is unavailable.
 */
export async function setCachedProfile(
  slugId: string,
  profile: CachedProfile,
): Promise<boolean> {
  const redis = getClient();
  if (!redis) return false;

  try {
    await redis.setex(cacheKey(slugId), CACHE_TTL, profile);
    return true;
  } catch {
    return false;
  }
}

/**
 * Invalidate cached profile data.
 * Call this when a profile is updated (e.g., after edit or XP change).
 */
export async function invalidateProfileCache(slugId: string): Promise<void> {
  const redis = getClient();
  if (!redis) return;

  try {
    await redis.del(cacheKey(slugId));
  } catch {
    // Non-critical — old cache will expire by TTL
  }
}

/**
 * Cache-aside helper: check cache first, call fetcher on miss.
 *
 * Usage:
 *   const profile = await cacheAside(slugId, () => fetchProfileFromDb(slugId))
 */
export async function cacheAside<T>(
  slugId: string,
  fetcher: () => Promise<T | null>,
  ttl = CACHE_TTL,
): Promise<T | null> {
  const redis = getClient();

  // Try cache
  if (redis) {
    try {
      const cached = await redis.get<T>(cacheKey(slugId));
      if (cached !== null) return cached;
    } catch {
      // Cache miss, fall through to fetcher
    }
  }

  // Fetch from source
  const data = await fetcher();
  if (data && redis) {
    try {
      await redis.setex(cacheKey(slugId), ttl, data);
    } catch {
      // Non-critical
    }
  }

  return data;
}
