# AI Rules — Butwal Hacks

Concise contract for AI agents generating code. Distilled from `AGENTS.md`, `CODING_STANDARDS.md`, and `DESIGN.md`.

**Authority:** When instructions here conflict with `AGENTS.md`, `AGENTS.md` wins. When instructions here conflict with a casual prompt, this file wins. Update this file when architectural rules change.

---

## 1. Before Writing Code

Answer these questions first. If any answer is unknown, stop and gather context.

```
What problem are we solving?
Who is the user?
Which route (9-Zone) does this belong to?
Which API endpoint?
Which database table(s) are affected?
Which role/permission is required?
Which existing component(s) can be reused?
Which design tokens apply?
Which tests need updating?
Which documentation changes are needed?
```

---

## 2. Architecture Constraints

| Constraint | Rule |
|------------|------|
| **Auth** | Auth0 ONLY. Never use Supabase Auth. Routes mount at `/auth/*` via `proxy.ts`. |
| **Database** | Supabase Service Role Key for mutations. Anon key for constrained public reads. Never client-side service role. |
| **Payments** | Open Collective ONLY. No Stripe. No payment processing code. |
| **Subdomains** | `butwalhacks.com` = marketing (Zone 1). `app.butwalhacks.com` = app (Zones 2-9). |
| **9-Zone Routes** | Zone 1: Public Marketing. Zone 2: Auth (`/auth/*`). Zone 3: ORCID/Profiles (`/p/[slug_id]`). Zone 4: Hacker Dashboard. Zone 5: Organizer Dashboard. Zone 6: Maintainer Dashboard. Zone 7: Orgs/Portal. Zone 8: Teams. Zone 9: API (`/api/*`). |
| **Middleware** | `proxy.ts` handles auth + subdomain routing. No separate `middleware.ts`. |
| **Bundler** | Webpack (default). NO Turbopack. |
| **CSS** | Tailwind CSS v4 with `@theme` directives. Use `bh-*` utility classes from `globals.css`. |
| **Ghost Profiles** | Issuing a trust marker to an unregistered email creates an unclaimed profile. The recipient claims it via Auth0 login at `/claim/[token]`. Never skip the ghost profile flow. |

---

## 3. Code Generation Rules

### Never

- Never rewrite existing files unless explicitly asked
- Never introduce `any` types — use `unknown` or concrete interfaces
- Never use inline `style={}` for colors — use Tailwind classes or `var(--bh-*)`
- Never install new npm packages without justification — check if existing patterns work
- Never hardcode secrets or environment variable values
- Never install a drag-and-drop library other than `@hello-pangea/dnd` or `framer-motion` — Kanban uses one of these two
- Never bypass RBAC checks in API routes
- Never use `backdrop-filter: blur()` — flat surfaces only (reserved for modals/toasts)

### Always

- Always import UI primitives from `@/components/ui/` or use `bh-*` utility classes
- Always validate user input in mutation routes (`@/lib/validation.ts`)
- Always check Auth0 session for authenticated routes
- Always use the structured logger (`@/lib/logger.ts`) for logging
- Always prefix unused parameters with `_`
- Always use `cn()` from `@/lib/utils.ts` for className composition
- Always use `@/` path alias for imports from `src/`
- Always prefer Server Components over Client Components

### File Naming

| Pattern | When |
|---------|------|
| `page.tsx` | App Router pages |
| `layout.tsx` | App Router layouts |
| `route.ts` | API route handlers |
| `component-name.tsx` | React components (kebab-case) |
| `lib-name.ts` | Utilities (kebab-case) |

---

## 4. Design System

| Element | Class/Token | Notes |
|---------|-------------|-------|
| Card | `bh-card` or `<Card>` component | Solid white, 1px border, 12px radius |
| Primary button | `bh-btn-primary` or `<Button variant="default">` | Red fill, pill shape, glow on hover |
| Secondary button | `bh-btn-secondary` or `<Button variant="outline">` | Outline, pill shape |
| Ghost button | `bh-btn-ghost` or `<Button variant="ghost">` | Transparent |
| Input | `bh-input` | 8px radius, red focus ring |
| Badge | `<Badge>` component | Mono font, uppercase, 6px radius |
| Container | `bh-container` | max-width 80rem, responsive padding |
| Section | `bh-section` | 4rem/6rem vertical padding |
| Trust marker (verified) | `bh-trust-marker-verified` | Red border + glow |
| Trust marker (self-reported) | `bh-trust-marker-self-reported` | Standard border, no glow |
| Trust marker (revoked) | `bh-trust-marker-revoked` | Gray, strikethrough |
| Colors | `bg-surface`, `text-primary`, `border-border`, etc. | Never inline style for colors |
| Brand red | `#FE0000` or `bg-[#FE0000]` | Only on CTAs and verified markers |

---

## 5. Rate Limiting Tiers

| Tier | Limit | Use For |
|------|-------|---------|
| `public_form` | 5/60s | Contact form, public submissions |
| `sensitive` | 3/60s | Login attempts, password reset |
| `user_action` | 5/60s | Profile updates, event registration |
| `frequent` | 10/60s | Search queries, list views |
| `bulk` | 30/60s | Data exports, sync operations |

```typescript
import { withRateLimit, checkRateLimit } from "@/lib/rate-limiter";

// Wrapper pattern (preferred)
export const GET = withRateLimit(handler, "frequent");

// Direct check (for conditional rate limiting)
const { allowed } = await checkRateLimit(request, "user_action");
```

---

## 6. Supabase Client Pattern

```typescript
// Server-side, anon key, RLS enforced — for constrained public reads
import { createClient } from "@/utils/supabase/server";

// Server-side only, service role key, RLS bypassed — for all mutations
import { createServiceClient } from "@/utils/supabase/service";

// Browser-side, anon key, singleton — for Realtime subscriptions
import { createClient } from "@/utils/supabase/client"; // "use client"
```

---

## 7. Error Handling

```typescript
// API errors
NextResponse.json({ error: "message" }, { status: 400 | 401 | 403 | 404 | 429 | 500 })

// Hard 404
notFound() // from next/navigation

// Logging
logger.error("[scope]", err);
logger.warn("[scope]", { key: value });
const log = logger.withErrorId("BH-ERR-xxxx");
```

---

## 8. The Agentic Loop (from AGENTS.md)

Operate in this continuous loop. Do not stop between steps:

### STEP 1: FETCH & DO
- Read the current state of the file or feature.
- Implement using the design language: flat solid surfaces as the base, selective blur only where functionally needed (modals, toasts, image captions), red glow on primary CTAs and verified trust markers only.
- No inline styles for colors. Use Tailwind classes or `var(--bh-*)`.
- Enforce subdomain logic and 9-Zone route architecture.

### STEP 2: REVIEW & TEST
- Run `npm run build` or `npx tsc --noEmit`.
- Scan for TypeScript errors, hydration mismatches, or lint warnings.
- Verify RBAC logic, subdomain redirects, and 9-Zone compliance.

### STEP 3: FIX & CLEANUP
- If any errors in Step 2, fix the specific files immediately.
- Execute Ponytail Audit: delete dead code, unused imports, stray routes.
- If fixes applied, return to Step 2.

### STEP 4: PROCEED
- If build passes with 0 errors and cleanup is complete, log success and move on.

---

## 9. Testing

| Type | Tool | Location |
|------|------|----------|
| Unit/Integration | Vitest | `__tests__/` folders alongside source |
| E2E | Playwright | `e2e/` directory |

```bash
npm run test         # vitest run
npx playwright test  # E2E
npx tsc --noEmit     # typecheck
npm run lint         # lint
npm run build        # full build
```

---

## 9. Keeping Promises to the Project

Every AI session should leave the codebase better than it found it:

- Delete dead code and unused imports (YAGNI)
- Fix lint warnings in files you touch
- Update documentation when changing behavior
- Add `ponytail:` comments when deliberately deferring an optimization (with ceiling + upgrade path)
- Never leave `TODO`, `FIXME`, or `placeholder` text in production code
- Execute a Ponytail Audit after every feature implementation (delete dead code, unused imports, stray routes)
