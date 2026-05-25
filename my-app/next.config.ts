import type { NextConfig } from "next";

/**
 * next.config.ts — production Next.js configuration for Butwal Hacks.
 *
 * Key settings:
 *  - poweredByHeader: disabled (removes "X-Powered-By: Next.js" response header)
 *  - reactStrictMode: enabled (catches common React pitfalls early)
 *  - images.remotePatterns: whitelist for future external images (CDN, avatars)
 */
const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Add external image hostnames here as needed, e.g.:
      // { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

export default nextConfig;
