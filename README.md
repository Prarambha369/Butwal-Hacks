# Butwal Hacks

Butwal Hacks is a nonprofit technology initiative focused on decentralizing innovation, mentorship, and practical learning opportunities for youth in Butwal and Rupandehi, Nepal.

This README is written for new volunteers and contributors so you can quickly understand:
- what is in this repository,
- how to run it in development and production mode,
- where to make changes feature-wise.

## Mission

To decentralize technology education and innovation in Nepal by providing youth in Lumbini Province with access to hands-on learning and mentorship.

## Vision

A future where Butwal is recognized as a vibrant technical hub, fostering innovation and social impact nationally.

## Tech Stack

- Framework: Next.js (App Router)
- Language: TypeScript
- Styling: Tailwind CSS (v4 style setup)
- UI primitives: shadcn/ui-style components
- Icons: Lucide React
- Theming: `next-themes`
- Analytics: Vercel Analytics + Google Analytics

## Quick Start (New Volunteers)

```bash
cd my-app
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production Build Commands

Run from `my-app/`:

```bash
npm run lint
npm run build
npm run start
```

Use this sequence before opening a PR to keep the web app production-ready.

## Feature-Wise File Map (Complete)

Every tracked file is listed below and grouped by similarity/feature.

### 1) Repository and Deployment Foundations

- `.gitignore`
- `LICENSE`
- `README.md`
- `package.json`
- `package-lock.json`
- `vercel.json`
- `logo.jpg`
- `logo.png`

### 2) App Workspace Configuration (`my-app/`)

- `my-app/.gitignore`
- `my-app/README.md`
- `my-app/package.json`
- `my-app/tsconfig.json`
- `my-app/next.config.ts`
- `my-app/postcss.config.mjs`
- `my-app/eslint.config.mjs`
- `my-app/components.json`

### 3) App Shell and Global Styling (`my-app/app/`)

- `my-app/app/layout.tsx`
- `my-app/app/page.tsx`
- `my-app/app/globals.css`
- `my-app/app/favicon.ico`

### 4) Shared Experience Components (`my-app/components/`)

- `my-app/components/hero.tsx`
- `my-app/components/mission.tsx`
- `my-app/components/trusted-by.tsx`
- `my-app/components/events-grid.tsx`
- `my-app/components/footer.tsx`
- `my-app/components/theme-toggle.tsx`

### 5) Reusable UI Primitives (`my-app/components/ui/`)

- `my-app/components/ui/badge.tsx`
- `my-app/components/ui/card.tsx`

### 6) Utilities (`my-app/lib/`)

- `my-app/lib/utils.ts`

### 7) Static Public Assets (`my-app/public/`)

- `my-app/public/logo.png`
- `my-app/public/file.svg`
- `my-app/public/globe.svg`
- `my-app/public/next.svg`
- `my-app/public/vercel.svg`
- `my-app/public/window.svg`

## Where To Contribute (By Feature)

- Brand, theme, typography, color tokens: `my-app/app/globals.css`
- SEO metadata, favicon, analytics scripts: `my-app/app/layout.tsx`
- Landing page structure: `my-app/app/page.tsx`
- Header/footer and navigation UX: `my-app/components/footer.tsx`, `my-app/components/theme-toggle.tsx`
- Landing section content modules: `my-app/components/hero.tsx`, `my-app/components/mission.tsx`, `my-app/components/events-grid.tsx`, `my-app/components/trusted-by.tsx`
- Reusable cards/badges: `my-app/components/ui/card.tsx`, `my-app/components/ui/badge.tsx`

## Contribution Workflow (Newbie Friendly)

1. Create a branch: `git checkout -b feat/short-description`.
2. Make focused changes in one feature area.
3. Run checks in `my-app/`: `npm run lint && npm run build`.
4. Commit with clear message: `git commit -m "feat: improve hero section copy"`.
5. Open PR with before/after notes and screenshots for UI changes.

## PR Quality Checklist

- `npm run lint` passes.
- `npm run build` passes.
- No broken links or console errors on major pages.
- Mobile layout checked.
- Accessibility basics checked (keyboard focus and contrast).

## Contact

- Website: https://butwalhacks.com
- Email: hello@butwalhacks.com
