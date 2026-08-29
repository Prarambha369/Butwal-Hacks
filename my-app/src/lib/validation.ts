/** Escape HTML entities to prevent injection in email/HTML contexts. */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** Strip HTML tags, trim whitespace, limit length. */
export function sanitizeString(input: string, maxLength = 5000): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .trim()
    .slice(0, maxLength);
}

/** Validate and sanitize an email address. Returns null if invalid. */
export function sanitizeEmail(input: string): string | null {
  const email = input.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email.slice(0, 254);
}

/** Validate and sanitize a URL. Returns null if invalid. */
export function sanitizeUrl(input: string): string | null {
  try {
    const parsed = new URL(input.startsWith("http") ? input : `https://${input}`);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed.toString().slice(0, 2048);
  } catch {
    return null;
  }
}

export const sanitizeUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s.trim().toLowerCase()) ? s.trim().toLowerCase() : null;

/** Validate search input length and allowed chars */
export function validateSearchInput(input: string): { valid: boolean; error?: string } {
  if (input.length > 100) return { valid: false, error: "Search query must be less than 100 characters" };
  if (!/^[a-zA-Z0-9\s\-'_]*$/.test(input)) return { valid: false, error: "Search query contains invalid characters" };
  return { valid: true };
}

// ─── Social Link Validation ────────────────────────────────────────────

type SocialPlatform = "github" | "linkedin" | "twitter" | "website"

const SOCIAL_DOMAINS: Record<SocialPlatform, string[]> = {
  github: ["github.com", "www.github.com"],
  linkedin: ["linkedin.com", "www.linkedin.com"],
  twitter: ["twitter.com", "www.twitter.com", "x.com", "www.x.com"],
  website: [], // any domain allowed
}

/**
 * Normalize a social link URL: trim, add https:// if missing, strip trailing slash.
 * Returns the normalized URL or null if invalid.
 */
export function normalizeSocialUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  try {
    const withProtocol = trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`

    const parsed = new URL(withProtocol)

    // Only allow http and https
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null

    // Remove trailing slash from path (but keep root / for domain-only URLs)
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith("/")) {
      parsed.pathname = parsed.pathname.slice(0, -1)
    }

    return parsed.toString().slice(0, 2048)
  } catch {
    return null
  }
}

/**
 * Validate a social link against platform-specific rules.
 * Returns the normalized URL on success, or null on failure.
 *
 * For github/linkedin/twitter, checks the domain matches the expected platform.
 * For website, allows any valid URL.
 */
export function validateSocialUrl(platform: SocialPlatform, url: string): string | null {
  const normalized = normalizeSocialUrl(url)
  if (!normalized) return null

  const allowed = SOCIAL_DOMAINS[platform]
  // If no domain restrictions (website), any valid URL is fine
  if (allowed.length === 0) return normalized

  try {
    const hostname = new URL(normalized).hostname.toLowerCase()
    if (!allowed.includes(hostname)) return null
    return normalized
  } catch {
    return null
  }
}

/**
 * Returns a human-readable error message for an invalid social link, or null if valid.
 * @example getSocialLinkError("github", "not-a-url") // "Enter a valid GitHub URL (e.g., https://github.com/username)"
 */
export function getSocialLinkError(platform: SocialPlatform, url: string): string | null {
  if (!url.trim()) return null // empty is allowed (optional field)

  const examples: Record<SocialPlatform, string> = {
    github: "https://github.com/username",
    linkedin: "https://linkedin.com/in/username",
    twitter: "https://twitter.com/username",
    website: "https://example.com",
  }

  const normalized = normalizeSocialUrl(url)
  if (!normalized) {
    return `Enter a valid URL (e.g., ${examples[platform]})`
  }

  const validated = validateSocialUrl(platform, url)
  if (!validated) {
    const platformNames: Record<SocialPlatform, string> = {
      github: "GitHub",
      linkedin: "LinkedIn",
      twitter: "Twitter/X",
      website: "website",
    }
    return `Enter a valid ${platformNames[platform]} URL (e.g., ${examples[platform]})`
  }

  return null // valid
}


