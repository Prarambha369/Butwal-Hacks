# Structure — Butwal Hacks

## Repository Layout
```
Butwal-Hacks/
├── my-app/               # Next.js application (all dev work goes here)
├── .amazonq/rules/       # Amazon Q rules and memory bank
├── package.json          # Root-level (minimal, workspace marker)
├── vercel.json           # Vercel deployment config
├── README.md             # Contributor onboarding guide
├── CONTRIBUTING.md       # Contribution guidelines
└── AGENTS.md             # Agent-specific instructions
```

## App Directory (`my-app/`)
```
my-app/
├── app/                  # Next.js App Router pages
│   ├── layout.tsx        # Root layout: fonts, analytics, providers, SEO
│   ├── page.tsx          # Home page
│   ├── main.css       # Global styles and CSS tokens
│   ├── sitemap.ts        # Auto-generated sitemap
│   ├── robots.ts         # robots.txt generation
│   ├── not-found.tsx     # 404 page
│   ├── about/            # About page
│   ├── 77-hacks/         # 77 Hacks event page
│   ├── blog/[slug]/      # Dynamic blog post pages
│   ├── community/        # Community page
│   ├── contact/          # Contact page
│   ├── cookie-policy/    # Legal page
│   ├── docs/engineering/ # Engineering docs section
│   ├── donors/           # Donor recognition
│   ├── events/[slug]/    # Dynamic event pages
│   ├── explore/          # Explore page
│   ├── governance/       # Governance page
│   ├── initiatives/[slug]/ # Dynamic initiative pages
│   ├── philosophy/       # Philosophy page
│   ├── privacy-policy/   # Legal page
│   ├── resources/        # Resources page
│   ├── showcase/         # Showcase page
│   ├── support/          # Support page
│   └── terms-of-service/ # Legal page
│
├── components/
│   ├── home/             # Home-specific components
│   │   └── desktop-landing.tsx
│   ├── ui/               # Reusable shadcn-style primitives
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── empty-state.tsx
│   │   └── skeleton.tsx
│   ├── animations/
│   │   └── animated-section.tsx
│   ├── blog/
│   │   └── blog-content.tsx
│   └── [feature components] # hero, footer, events-grid, mission, etc.
│
├── hooks/                # Custom React hooks
│   ├── useInViewOnce.ts
│   └── useSmoothScroll.ts
│
├── lib/                  # Utilities and data helpers
│   ├── content.ts        # CMS-like content data
│   ├── members.ts        # Member directory data
│   ├── nav-config.ts     # Navigation structure
│   ├── seo.ts            # SEO helpers / metadata builders
│   ├── utils.ts          # cn() utility (clsx + tailwind-merge)
│   └── validation.ts     # Zod schemas for forms
│
└── public/               # Static assets (logo, SVGs)
```

## Architectural Patterns
- Next.js App Router: all pages are React Server Components by default; client components use `"use client"` directive
- Data lives in `lib/` as typed TypeScript modules (no external CMS or database)
- Shared providers (theme, smooth scroll, toast) are composed in `components/shell-provider.tsx` and mounted in `app/layout.tsx`
- Reusable primitives live in `components/ui/`, feature-level components live directly in `components/`
- SEO metadata is centralized via `lib/seo.ts` helpers called from each page's `generateMetadata`
- Legal and structural pages use a shared `legal-document-layout.tsx` wrapper
- Dynamic routes use `[slug]` folders; content is resolved from `lib/content.ts`
