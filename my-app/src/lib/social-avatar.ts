/**
 * Importing an avatar that already exists at a social provider.
 *
 * Auth0 returns a `picture` claim for social logins (GitHub, Google,
 * LinkedIn), and it is tempting to store that URL directly. Do not:
 *
 *  - Google's `lh3.googleusercontent.com` URLs are signed and expire within
 *    hours, so a stored link is a broken image days later.
 *  - LinkedIn's `media.licdn.com` URLs often 403 without a matching referer.
 *  - Depending on a third party means the image can change or vanish without
 *    us knowing.
 *
 * So the picture is copied into our own Cloudinary account once, and only that
 * stable URL is persisted.
 *
 * The URL arrives from the client, so it is treated as hostile: only https,
 * only an allowlisted provider host, and the resolved address must not be
 * private or loopback (SSRF).
 */

/** Hosts that serve Auth0 social-login avatars. */const ALLOWED_HOSTS = [
  "avatars.githubusercontent.com",
  "github.com",
  "lh3.googleusercontent.com",
  "lh4.googleusercontent.com",
  "lh5.googleusercontent.com",
  "lh6.googleusercontent.com",
  "ssl.gstatic.com",
  "media.licdn.com",
  "licdn.com",
] as const;

export type SocialProvider = "github" | "google" | "linkedin";

/** Which provider a picture URL belongs to, for labelling the UI. */
export function socialProviderFor(pictureUrl: string): SocialProvider | null {
  let host: string;
  try {
    host = new URL(pictureUrl).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (host === "avatars.githubusercontent.com" || host === "github.com") return "github";
  if (host.endsWith("googleusercontent.com") || host === "ssl.gstatic.com") return "google";
  if (host === "licdn.com" || host.endsWith(".licdn.com")) return "linkedin";
  return null;
}

function hostAllowed(host: string): boolean {
  return ALLOWED_HOSTS.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`)
  );
}

/**
 * Accept only an https URL on an allowlisted provider host.
 *
 * Rejects protocol-relative and non-http(s) schemes, and any userinfo or
 * port trickery (`https://allowed.host@evil.com` parses with an
 * allowlisted-looking authority but points elsewhere).
 */
export function isAllowedSocialAvatarUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  if (url.username || url.password) return false;
  if (url.port && url.port !== "443") return false;
  return hostAllowed(url.hostname.toLowerCase());
}

const IPV4_LITERAL = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

/** Private, loopback, link-local and unique-local ranges. */
export function isPrivateAddress(address: string): boolean {
  const ip = address.toLowerCase();
  const v4 = ip.match(IPV4_LITERAL);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  if (ip === "::1" || ip === "::") return true;
  if (ip.startsWith("fe80") || ip.startsWith("fc") || ip.startsWith("fd")) return true;
  // IPv4-mapped IPv6, e.g. ::ffff:127.0.0.1
  const mapped = ip.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (mapped) return isPrivateAddress(mapped[1]);
  return false;
}

/**
 * Whether the string is an IP literal rather than a hostname.
 *
 * Deliberately pattern based instead of using node:net, because the settings
 * form imports this module from a Client Component. Callers pass the result of
 * a DNS lookup, so the value is an address by construction.
 */
function isIpLiteral(address: string): boolean {
  return IPV4_LITERAL.test(address) || (address.includes(":") && /^[0-9a-f:.]+$/i.test(address));
}

export function isPublicAddress(address: string): boolean {
  if (!isIpLiteral(address)) return false;
  return !isPrivateAddress(address);
}
