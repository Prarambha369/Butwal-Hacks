import { Redis } from "@upstash/redis";

/**
 * Edge caching utility using Upstash Redis.
 *
 * Wraps a data-fetching function with a Redis cache layer.
 * Automatically serializes/deserializes JSON values.
 * Gracefully degrades (skips cache) when Redis is unavailable.
 *
 * Usage:
 *   const data = await withCache("my-key", () => fetchData(), 300);
 *
 * TTL is in seconds. Default: 300 (5 minutes).
 */
let redisClient: Redis | null = null;

function getRedis(): Redis | null {
  if (redisClient !== null) return redisClient;
  if (process.env.UPSTASH_REDIS_REST_URL) {
    try {
      redisClient = Redis.fromEnv();
    } catch {
      redisClient = null;
    }
  }
  return redisClient;
}

export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 300,
): Promise<T> {
  const redis = getRedis();

  // Attempt cache read
  if (redis) {
    try {
      const cached = await redis.get<T>(key);
      if (cached !== null) {
        return cached;
      }
    } catch {
      // Cache read failed — fall through to fetch
    }
  }

  // Fetch fresh data
  const data = await fetcher();

  // Attempt cache write (fire-and-forget)
  // @upstash/redis auto-serializes objects via JSON.stringify, so pass data directly.
  if (redis) {
    try {
      await redis.setex(key, ttlSeconds, data as any);
    } catch {
      // Cache write failed — data is still returned
    }
  }

  return data;
}

/**
 * Bust a cached key by deleting it from Redis.
 * Useful after mutations that invalidate the cached data.
 */
export async function bustCache(key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    // Graceful degradation
  }
}

