# Guidelines — Butwal Hacks

## Client vs Server Components
- Pages are React Server Components by default (no directive needed)
- Add `"use client"` only when the component uses hooks, browser APIs, or event handlers
- Frequency: every interactive component in `components/` uses `"use client"` at the top of the file

## Component Structure Pattern
- Named exports for reusable components: `export function MemberDirectory()`
- Default exports for page-level or route components: `export default function DesktopLanding()`
- Co-located sub-components (e.g. `MemberCard`, `FadeIn`, `CountUp`) are defined in the same file above the main export when they are only used internally

## Imports Order Convention
```ts
// 1. Next.js built-ins
import Link from "next/link"
import Script from "next/script"
// 2. React and types
import type { ReactNode } from "react"
import { useEffect, useRef, useState } from "react"
// 3. Third-party libraries
import * as THREE from "three"
// 4. Internal aliases (@/lib, @/hooks, @/components)
import { cn } from "@/lib/utils"
import { useInViewOnce } from "@/hooks/useInViewOnce"
import { members } from "@/lib/members"
```

## Path Aliases
- Always use `@/` alias for internal imports (never relative `../../`)
- `@/lib/utils` → cn() utility
- `@/hooks/` → custom hooks
- `@/components/ui/` → primitive UI components
- `@/lib/content` → typed content data

## Styling — Tailwind CSS
- Use the `cn()` utility (clsx + tailwind-merge) for conditional/merged class strings:
  ```ts
  import { cn } from "@/lib/utils"
  className={cn("base-classes", condition && "conditional-class")}
  ```
- Dark mode uses `dark:` variants; avoid inline style for theming except gradients
- Light mode overrides use `light:` variant where needed
- CSS token pattern: `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-card`, `text-primary`
- Spacing scale: sections use `py-20`, `py-24`, `py-32`, `py-40`; max-width containers use `max-w-5xl` or `max-w-6xl` with `mx-auto`

## Animation Patterns
- **Animejs v4** for entrance animations on mount (hero, card stagger):
  ```ts
  import("animejs").then(({ animate, stagger }) => {
    animate(el.querySelectorAll(".hero-animate"), {
      opacity: [0, 1],
      translateY: [28, 0],
      duration: 800,
      ease: "outQuad",       // v4 short form, NOT "easeOutQuad"
      delay: stagger(120, { start: 60 }),
    })
  })
  ```
- **Animejs is always dynamically imported** (`import("animejs")`) — never statically at the top
- **useInViewOnce hook** for scroll-triggered reveals (wraps IntersectionObserver, disconnects after first trigger):
  ```ts
  const { ref, isVisible } = useInViewOnce<HTMLDivElement>(0.12)
  ```
- Always check `prefers-reduced-motion` before running animations:
  ```ts
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  if (prefersReduced) return
  ```
- `FadeIn` wrapper component pattern: applies `section-fade` + `is-visible` CSS classes with optional `delay` prop

## Accessibility
- All decorative icons get `aria-hidden="true"`
- Interactive links and buttons always have `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2`
- Social links use both `aria-label` and `title` attributes
- Sections use `aria-labelledby` pointing to the section's heading id
- External links always include `target="_blank" rel="noopener noreferrer"`

## SEO & Metadata
- Root metadata defined in `app/layout.tsx` using Next.js `Metadata` type
- Page-level metadata uses `generateMetadata()` with helpers from `@/lib/seo`
- `metadataBase` set to `https://butwalhacks.com`
- Title template: `"%s | Butwal Hacks"`
- Always include OpenGraph and Twitter card metadata
- Viewport exported separately as `Viewport` type from `next`

## Form Handling
- Forms use `react-hook-form` + `@hookform/resolvers`
- Validation schemas defined with Zod in `lib/validation.ts`
- Toast feedback via Sonner (`sonner` package), provided globally by `ToastProvider`

## Data Layer
- All content (blog posts, initiatives, events) is typed TypeScript exported from `lib/content.ts`
- Member data is typed and exported from `lib/members.ts`
- Navigation structure is centralized in `lib/nav-config.ts`
- No external CMS or database — everything is static typed data

## Three.js Usage Pattern
- Three.js scenes are managed entirely inside a `useEffect`
- All Three.js refs (scene, camera, renderer, particles) stored in `useRef`
- Always clean up in the effect return: `renderer.dispose()`, `geometry.dispose()`, `material.dispose()`, remove DOM element
- Always handle window resize by updating camera aspect and renderer size

## Hook Conventions
- Hooks live in `my-app/hooks/` with camelCase filenames: `useInViewOnce.ts`, `useSmoothScroll.ts`
- Hooks marked `"use client"` at file top when they use browser APIs
- Hooks are generic where possible: `useInViewOnce<T extends HTMLElement>(threshold = 0.15)`

## Provider Composition
- All global providers are composed in `components/shell-provider.tsx`
- Provider order in `app/layout.tsx`: `ThemeProvider` → `ShellProvider` → `SmoothScrollWrapper` → page content
- Analytics (`@vercel/analytics`) and Google Analytics (`next/script`) loaded inside `<body>` in `layout.tsx`

## Security
- Never remove security headers in `next.config.ts`
- CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy are all required
- `poweredByHeader: false` and `reactStrictMode: true` must remain enabled

## PR Checklist
1. `npm run lint` — must pass
2. `npm run build` — must pass
3. No broken links or console errors
4. Mobile layout checked
5. Accessibility: keyboard focus + color contrast
