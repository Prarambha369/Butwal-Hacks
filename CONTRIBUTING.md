# Contributing to Butwal Hacks

Thank you for your interest in building the future of technology education in Nepal! We welcome contributions from students, mentors, and engineers of all skill levels.

> **Butwal Hacks** is a high-end hacker workshop — an ORCID-style verification system and hackathon management platform powering Nepal's next generation of builders.

---

## 🛠 Philosophy: The "Ponytail" Approach

We follow the **Lazy Senior Developer** mindset:
- **Avoid Over-Engineering**: The simplest solution that works is the best one.
- **Prefer Standard Libraries**: Use native platform features before adding dependencies.
- **Deletion > Addition**: The best code is the code that isn't written.
- **Boring is Better**: Prefer predictable, readable code over "clever" abstractions.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 20+**
- **npm** (included with Node)

### Local Setup

```bash
# Clone the repo
git clone https://github.com/Prarambha369/Butwal-Hacks.git
cd Butwal-Hacks

# Install dependencies (lockfile at root)
npm install

# Set up environment
cp .env.example my-app/.env.local
# Edit my-app/.env.local — see .env.example for required keys

# Start development server (from repo root)
npm run dev
# → http://localhost:3000
```

> **Commands:** All commands run from the **repo root** (`npm install`, `npm run dev`, `npm run lint`).
> **Source code:** Lives under `my-app/src/`. Entry point: `my-app/src/app/layout.tsx`.

### Verification

```bash
npm run lint                  # ESLint check
cd my-app && npx tsc --noEmit # TypeScript typecheck
npm run test                  # Vitest unit tests
npm run build                 # Full Next.js production build
```

---

## 📐 Design Language

All PRs should feel like they belong to the same product. These guidelines keep the interface consistent without being prescriptive about every detail.

**Foundations:**
- Cards and surfaces are solid white (`#FFFFFF` in light mode) with crisp 1px borders (`#E5E5E5`)
- Primary buttons are pill-shaped (`rounded-full`), red (`#FE0000`), and glow on hover
- Secondary buttons are outline pills, no glow
- Butwal Red is reserved for actions and verified trust markers — not decorative use
- `backdrop-filter: blur()` is acceptable for functional separation: modal overlays, status toasts, image captions. Not for cards, buttons, or page sections.
- Gradient backgrounds on page sections should be avoided. Gradients on photos (hero overlays, image fades) are fine.

### Official Color Palette (Use Exact Hex Codes)

| Role | Hex | Usage |
|------|-----|-------|
| **Primary Red** | `#FE0000` | CTAs, Trust Markers, brand accents |
| **Deep Red** | `#B10000` | Hover states |
| **Dark Red** | `#7b0000` | Deep backgrounds |
| **Background Base** | `#F7F7F8` | Page background |
| **Surface** | `#FFFFFF` | Cards, modals, inputs |
| **Border** | `#E5E5E5` | Dividers, container edges |
| **Text Muted** | `#888888` | Secondary/tertiary text |
| **Text Body** | `#333333` | Primary paragraph text |
| **Text Primary** | `#1F1F1F` | Headings, titles |

### CSS Rules

```css
/* ✅ CORRECT — Tailwind arbitrary values */
bg-[#FE0000] text-[#1F1F1F] border-[#E5E5E5]

/* ❌ WRONG — Never use inline styles for colors */
style={{ backgroundColor: '#FE0000' }}

/* ❌ WRONG — No backdrop blur or glass effects */
backdrop-blur-[30px]  /* Reject in PRs */
```

### Surface Classes

| Component | Classes |
|-----------|---------|
| **Card** | `bh-card` — solid white, 1px border, no blur |
| **Primary Button** | `bh-btn-pill` — pill-shaped, red, glow on hover |
| **Secondary Button** | `bh-btn-secondary` — outline pill, no glow |
| **Input** | `bh-input` — flat, 1px border, no blur |
| **Trust Marker (Verified)** | `border-[#FE0000] shadow-[0_0_12px_rgba(254,0,0,0.12)]` |
| **Trust Marker (Self-Reported)** | `border-[#E5E5E5]` |
| **Trust Marker (Revoked)** | `text-[#898989] line-through` |

---

## 🔧 Key Patterns

| Pattern | Convention |
|---------|-----------|
| Server vs Client | Default to server component. Add `"use client"` only for hooks, state, or browser APIs |
| Auth | Auth0 via `@auth0/nextjs-auth0`. `getSession()` for server, `useUser()` for client |
| Database | Supabase service client (`createServiceClient()`) bypasses RLS |
| i18n | `t(key, locale)` from `@/lib/i18n` — English + Nepali |
| Styling | Tailwind arbitrary values, never inline `style={{}}` |
| API Security | All POST routes use `withRateLimit()` + Zod validation + Auth0 session check |
| SEO | New routes have `generateMetadata` or `notFound()` for hard 404s |

---

## 📋 PR Checklist

- [ ] **TypeScript**: `npx tsc --noEmit` passes
- [ ] **Lint**: No new errors (`npm run lint`)
- [ ] **Tests**: Existing tests pass (`npm run test`)
- [ ] **Build**: `npm run build` succeeds
- [ ] **Design**: Follows the Butwal Hacks design language (no inline style colors, intentional use of blur/shadows)
- [ ] **Mobile**: Works on 375px viewport
- [ ] **SEO**: All new pages have metadata and/or `notFound()` for missing data
- [ ] **Auth**: Signed-in and anonymous states handled

---

## 🆘 Need Help?

- **GitHub Issues**: Open an issue or comment on an existing one.
- **Email**: `hello@butwalhacks.com`

## ⚖️ Code of Conduct

Be respectful, constructive, and inclusive. We are here to learn and build together for the community.
