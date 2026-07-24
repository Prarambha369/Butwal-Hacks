# Coding Standards — Butwal Hacks

Extracted from the existing codebase. All new code must follow these conventions.

---

## 1. TypeScript

### Strict Mode
`tsconfig.json` sets `"strict": true`. No `any` types in production code. If a type is missing, define an interface or use `unknown` with a type guard.

### File Extensions
- `.ts` — utilities, types, server-only code, API route handlers
- `.tsx` — components, pages (anything with JSX)
- `.mjs` — ESLint config, scripts (ESM module format)

### No `any`
The `@typescript-eslint/no-explicit-any` rule is disabled globally (`"off"`) in `eslint.config.mjs` with the intent to fix incrementally. New code must NOT introduce new `any` types. Use `unknown` with type narrowing instead:

```typescript
// Bad
function process(data: any) { ... }

// Good
function process(data: unknown) {
  if (typeof data === 'string') { ... }
}
```

### Unused Variables
`@typescript-eslint/no-unused-vars` is set to `"warn"` with `argsIgnorePattern: "^_"`. Prefix intentionally unused parameters with underscore:

```typescript
function handler(_request: Request, params: { id: string }) { ... }
```

---

## 2. Naming Conventions

### Files
| Pattern | Example | Used For |
|---------|---------|----------|
| `page.tsx` | `dashboard/hacker/page.tsx` | App Router pages |
| `layout.tsx` | `dashboard/hacker/layout.tsx` | App Router layouts |
| `loading.tsx` | `explore/loading.tsx` | App Router loading states |
| `error.tsx` | `error.tsx` | App Router error boundaries |
| `route.ts` | `api/events/route.ts` | API route handlers |
| `component-name.tsx` | `empty-state.tsx` | React components |
| `kebab-case.ts` | `rate-limiter.ts` | Utility files |
| `PascalCase.tsx` | `button.tsx` (component name) | Component files (inner export is PascalCase) |

### Exports
- **Components**: Named exports (e.g., `export function Button`, `export { EmptyState, NoResultsState }`)
- **Utilities**: Named exports (e.g., `export const cn`, `export function sanitizeString`)
- **Constants**: Named exports with `UPPER_SNAKE_CASE` for config values, `camelCase` for derived values
- **Types/Interfaces**: PascalCase, exported

### Variables & Functions
- `camelCase` for variables, functions, and method names
- `PascalCase` for components, types, interfaces, and classes
- `UPPER_SNAKE_CASE` for compile-time constants only (`INITIAL_XP = 0`)
- `kebab-case` for file names

---

## 3. Imports

### Ordering (convention, not enforced by linter)
1. External dependencies (`react`, `next/*`, `@auth0/*`, `@supabase/*`, `lucide-react`)
2. Internal absolute imports (`@/components/*`, `@/lib/*`, `@/utils/*`)
3. Relative imports (`./components/*`, `../lib/*`)
4. Types (`import type { Profile } from "@/lib/supabase-types"`)

Use `type` imports for type-only imports:

```typescript
import type { Profile, Role } from "@/lib/supabase-types";
```

### Path Aliases
Always use `@/` alias for imports from `src/`:

```typescript
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
```

---

## 4. React Components

### Server vs Client
- **Server Components** by default in Next.js App Router
- **Client Components** only when needed: `"use client"` at the top for:
  - State/effects (`useState`, `useEffect`)
  - Browser APIs (`localStorage`, `window`)
  - Event handlers (`onClick`, `onSubmit`)
  - `useUser()` from Auth0 SDK
  - Custom hooks (`usePresence`, `useAnalytics`)

### Component Structure
```typescript
"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface MyComponentProps {
  title: string;
  description?: string;
}

export function MyComponent({ title, description }: MyComponentProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="min-w-20 min-h-10" />;

  return (
    <div data-slot="my-component" className={cn("bh-card p-6")}>
      <h3 className="text-lg font-bold text-primary">{title}</h3>
      {description && <p className="text-sm text-secondary">{description}</p>}
    </div>
  );
}
```

### Key Patterns
- `data-slot="component-name"` attribute on root element for CSS targeting
- `cn()` from `@/lib/utils` for className composition (wraps `tailwind-merge`)
- Early return for loading/empty states
- Props interface defined above component
- Forward refs only when needed (e.g., form inputs)

### Empty States
Use the `EmptyState` component from `@/components/ui/empty-state`:

```typescript
<EmptyState
  icon={<FolderKanban className="w-12 h-12" />}
  title="No projects yet"
  description="Submit your first project to start building your portfolio."
  actions={[{ label: "Create Project", href: "/dashboard/projects/new", variant: "primary" }]}
/>
```

---

## 5. Server Actions and API Routes

### Route Handlers
API routes live in `src/app/api/` following the pattern:

```typescript
// src/app/api/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { withRateLimit } from "@/lib/rate-limiter";

export const GET = withRateLimit(async (request: NextRequest) => {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... handler logic
  return NextResponse.json(events);
}, "frequent");

export const POST = withRateLimit(async (request: NextRequest) => {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  // Validate with Zod
  // ... mutation logic
  return NextResponse.json(result, { status: 201 });
}, "user_action");
```

### Auth Pattern
Every mutation route (`POST`, `PUT`, `DELETE`) checks for an Auth0 session. Public routes (like `/api/contact`) use Zod validation and rate limiting.

### Supabase Clients
Three clients, each in `src/utils/supabase/`:
- `server.ts` — `createClient()` with anon key, server-side, RLS enforced, no session persistence
- `service.ts` — `createServiceClient()` with service role key, bypasses RLS, server-side only. NEVER exposed to client.
- `client.ts` — `createClient()` with anon key, browser singleton, no session persistence

### Rate Limiting
Use the tiered rate limiter from `@/lib/rate-limiter`:

```typescript
import { withRateLimit, checkRateLimit } from "@/lib/rate-limiter";

// Wrapper pattern (recommended)
export const GET = withRateLimit(handler, "frequent");

// Direct check pattern
const { allowed, remaining, reset } = await checkRateLimit(request, "user_action");
if (!allowed) return rateLimitResponse(reset);
```

Available tiers: `public_form` (5/60s), `sensitive` (3/60s), `user_action` (5/60s), `frequent` (10/60s), `bulk` (30/60s).

---

## 6. Validation

Use `@/lib/validation.ts` for common sanitization:
- `sanitizeString(input, maxLength)` — strips HTML, trims, limits length
- `sanitizeEmail(input)` — validates + sanitizes email, returns `string | null`
- `sanitizeUrl(input)` — validates + normalizes URL, returns `string | null`
- `sanitizeUuid(s)` — validates UUID format, returns `string | null`
- `validateSocialUrl(platform, url)` — validates platform-specific social links
- `getSocialLinkError(platform, url)` — returns human-readable error message

All user-facing mutation routes should validate input with these utilities before writing to the database.

---

## 7. Error Handling

### API Error Responses
Standardized format:

```typescript
// 400 — Validation error
NextResponse.json({ error: "Invalid email format" }, { status: 400 })

// 401 — Unauthorized
NextResponse.json({ error: "Unauthorized" }, { status: 401 })

// 404 — Not found (hard 404 via notFound())
notFound()

// 429 — Rate limited
rateLimitResponse(reset)

// 500 — Server error
NextResponse.json({ error: "Internal server error" }, { status: 500 })
```

### Client-Side Error Boundary
`app/error.tsx` catches runtime errors and displays a branded error page with:
- Auto-generated error ID (`BH-ERR-{timestamp}-{random}`)
- Report to `/api/report-error` endpoint (fire-and-forget)
- Retry button that calls `reset()`
- Dev mode: shows error details in a collapsible panel

### Logging
Use the structured logger from `@/lib/logger`:

```typescript
import { logger } from "@/lib/logger";

// Simple logging
logger.error("[api/events]", err);
logger.warn("[api/events]", { missingField: "title" });
logger.info("User registered", { userId, eventId });

// With error ID for full-stack traceability
const log = logger.withErrorId("BH-ERR-a1b2c3-d4e5");
log.error("[api/events]", someError); // error_id auto-attached
```

Development: logs to console. Production: sends structured JSON to Axiom (fire-and-forget, non-blocking).

---

## 8. Design System

### Never Use Inline Styles for Colors
All colors must use either:
- Tailwind utility classes with `--bh-*` variables: `bg-surface`, `text-primary`, `border-border`
- Exact hex arbitrary values: `bg-[#FE0000]`, `text-[#FE0000]`
- CSS custom properties: `var(--bh-primary-red)`

### Components
Always import UI primitives from `@/components/ui/`:

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
```

### Utility Classes
Use `bh-*` classes defined in `globals.css` `@layer utilities`:
- `bh-card` — solid white card, 1px border, 12px radius
- `bh-btn-primary` — red pill button with glow on hover
- `bh-btn-secondary` — outline pill button
- `bh-btn-ghost` — transparent button
- `bh-input` — form input with focus ring
- `bh-section` — section spacing
- `bh-container` — max-width container
- `bh-trust-marker-verified` — verified credential badge
- `bh-trust-marker-self-reported` — self-reported credential badge
- `bh-trust-marker-revoked` — revoked credential badge

---

## 9. Testing

### Framework
- **Unit/Integration**: Vitest (config in `vitest.config.ts`)
- **E2E**: Playwright (config in `playwright.config.ts`)

### Test Files
- Co-located with source: `component-name.test.tsx` or `lib-name.test.ts`
- Test directory: `__tests__/` folders alongside source files

### Patterns
- Unit tests for utilities, validation, and business logic
- Integration tests for API routes
- E2E for critical user flows (auth, registration, profile)

---

## 10. Dependencies

### Adding Dependencies
Before adding a new npm dependency, check:
1. Can the standard library or platform feature achieve this? (e.g., `crypto` module, built-in Web APIs)
2. Is there already an established pattern in the codebase that serves this purpose?
3. Is the dependency tree small and well-maintained?

### Existing Key Dependencies
- `@auth0/nextjs-auth0` — authentication
- `@supabase/supabase-js` — database
- `tailwind-merge` — className merging (via `cn()`)
- `@upstash/redis` + `@upstash/ratelimit` — rate limiting
- `lucide-react` — icons
- `sonner` — toasts
- `framer-motion` — animations
- `next-themes` — theme toggling
- `@hello-pangea/dnd` — drag and drop
- `@sentry/nextjs` — error monitoring

---

## 11. Git and Commits

### Branch Naming
`type/description-in-kebab-case` — e.g., `fix/auth-redirect-loop`, `feat/team-matching-ui`, `chore/ponytail-audit`

### Commit Messages
```
type(scope): description — 72 char max

type: feat, fix, refactor, chore, test, docs, ci, style, perf
scope: the affected module or page (optional)
```

Examples:
```
feat(hacker-dash): add XP progress bar to dashboard header
fix(team-matching): prevent duplicate teammate suggestions
chore: update .gitignore with strix_runs/ and test-results/
```

---

## 12. AI Generation Rules

When generating code for Butwal Hacks:

1. **Do NOT** rewrite existing files unless explicitly requested
2. **Do NOT** introduce new `any` types — use `unknown` or concrete interfaces
3. **Do NOT** use inline `style={}` for colors — use Tailwind classes or `var(--bh-*)`
4. **Do NOT** install new npm packages without justification — check if existing patterns work
5. **Prefer** Server Components over Client Components (add `"use client"` only when necessary)
6. **Always** import UI primitives from `@/components/ui/` or use `bh-*` utility classes
7. **Always** validate user input in mutation routes
8. **Always** check Auth0 session for authenticated routes
9. **Always** use the existing logger for any logging
10. **Always** follow the established file naming and export conventions

---

## 13. File Organization

```
src/
  app/          — App Router pages, layouts, and API routes
  components/   — React components
    sections/   — Page-level sections (Navbar, Hero, Footer)
    ui/         — Primitives (Button, Card, Badge, Input)
    home/       — Landing page sections
    dashboard/  — Dashboard components
    hacker-id/  — Public profile components
  hooks/        — Custom React hooks
  lib/          — Business logic, validation, utilities
    actions/    — Server Actions
    ai/         — AI integrations (Groq, embeddings)
  types/        — TypeScript type definitions
  utils/        — Supabase client factories
```
