import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Butwal Hacks',
    short_name: 'BHacks',
    description: "Student hackathons, projects & verified credentials in Nepal.",
    start_url: '/',
    display: 'standalone',
    background_color: '#F7F7F8',
    theme_color: '#FE0000',
    icons: [
      // ─── SVG (modern browsers) ───────────────────────────────
      {
        src: '/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      // ─── PNG (Android / legacy browser support) ───────────────
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
