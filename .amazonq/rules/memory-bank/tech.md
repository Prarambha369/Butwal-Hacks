# Tech — Butwal Hacks

## Core Stack
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | ^16.1.6 |
| Language | TypeScript | ^5 |
| Runtime | React | 19.2.0 |
| Styling | Tailwind CSS | ^4.1.9 |
| UI Primitives | Radix UI (full suite) + shadcn-style | various |
| Icons | Lucide React | ^0.454.0 |
| Theming | next-themes | ^0.4.6 |
| Animations | Anime.js, animate.css, tailwindcss-animate | ^4.3.6 / ^4.1.1 |
| Smooth Scroll | Lenis | ^1.1.13 |
| 3D / Canvas | Three.js | ^0.158.0 |
| Forms | react-hook-form + @hookform/resolvers | ^7.60.0 |
| Validation | Zod | 3.25.76 |
| Analytics | @vercel/analytics | 1.3.1 |
| Charts | Recharts | 2.15.4 |
| Carousel | Embla Carousel, Swiper | 8.5.1 / ^11.1.14 |
| Date utils | date-fns | 4.1.0 |
| Toast | Sonner | ^1.7.4 |
| CSS merge | clsx + tailwind-merge | ^2.1.1 / ^3.3.1 |

## Build Tooling
- PostCSS with `@tailwindcss/postcss` plugin
- ESLint 9 with `eslint-config-next`
- TypeScript strict mode via `tsconfig.json`

## Development Commands
All commands run from `my-app/`:
```bash
npm run dev       # Start dev server (http://localhost:3000)
npm run build     # Production build
npm run start     # Serve production build
npm run lint      # ESLint check
```

Pre-PR sequence: `npm run lint && npm run build`

## Deployment
- Platform: Vercel
- Config: `vercel.json` at repo root
- Analytics: Vercel Analytics + Google Analytics (GTM via layout.tsx)

## Security Headers (next.config.ts)
- Content-Security-Policy (strict)
- Strict-Transport-Security (HSTS, 2 years)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: origin-when-cross-origin
- Permissions-Policy: camera, mic, geolocation all denied
- `poweredByHeader: false`
- `reactStrictMode: true`

## Key Configuration Files
- `my-app/next.config.ts` — Next.js + security headers
- `my-app/tsconfig.json` — TypeScript config
- `my-app/postcss.config.mjs` — PostCSS / Tailwind pipeline
- `my-app/eslint.config.mjs` — ESLint flat config
- `my-app/components.json` — shadcn/ui component registry config
