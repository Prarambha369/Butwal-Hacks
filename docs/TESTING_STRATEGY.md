# Testing Strategy — Butwal Hacks

What to test, how to test it, and what each test level covers.

---

## 1. Test Levels

| Level | Tool | Speed | Scope | Run In CI |
|-------|------|-------|-------|-----------|
| **Unit** | Vitest | Fast (<1s per file) | Single function, component, or utility | Yes (every PR) |
| **Integration** | Vitest | Medium (<5s per file) | API routes, Server Actions, database operations | Yes (every PR) |
| **E2E** | Playwright | Slow (<30s per test) | Critical user flows across multiple pages | Yes (every PR, separate job) |

### When to Use Each

- **Unit test:** Pure functions, validation logic, utility functions, formatting helpers
- **Integration test:** API handlers, database operations, authentication flows, Server Actions
- **E2E test:** Auth flow (login/logout), event registration, project submission, profile editing

---

## 2. Test File Organization

Tests are co-located with source files in `__tests__/` directories:

```
src/
  lib/
    validation.ts
    __tests__/
      validation.test.ts          # Unit tests for validation
  lib/actions/
    events.ts
    __tests__/
      events.test.ts              # Integration tests for action
  components/
    tasks/
      kanban-board.tsx
      __tests__/
        kanban-board.test.tsx      # Component tests
  app/api/
    webhooks/
      __tests__/
        proxy.test.ts              # API route integration tests
  __tests__/
    smoke.test.ts                  # Smoke tests (build, imports)
```

E2E tests live in a separate `e2e/` directory:

```
e2e/
  smoke.spec.ts                   # Basic smoke test
  task-flow.spec.ts               # Kanban task CRUD flow
  rbac-routing.spec.ts            # Role-based access control
  kanban-realtime.spec.ts         # Real-time task updates
  avatar-upload.spec.ts           # Cloudinary upload flow
  crop-interaction.spec.ts        # Image crop interaction
  helpers.ts                      # Shared E2E helpers
```

---

## 3. Vitest Configuration

Defined in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".next", "e2e"],
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder-anon-key",
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
```

Key points:
- Environment is `node` (not `jsdom`) — the project uses `node` for all test environments
- `@/` path alias is configured for imports
- Placeholder Supabase env vars are provided so Supabase client imports don't crash
- E2E tests are excluded from Vitest (Playwright handles them)

---

## 4. Unit Testing Patterns

### Testing Pure Functions

```typescript
// src/lib/__tests__/validation.test.ts
import { describe, it, expect } from "vitest";
import { sanitizeString, sanitizeEmail, sanitizeUrl } from "../validation";

describe("sanitizeString", () => {
  it("strips HTML tags", () => {
    expect(sanitizeString("<script>alert('xss')</script>Hello")).toBe("Hello");
  });

  it("trims whitespace", () => {
    expect(sanitizeString("  hello  ")).toBe("hello");
  });

  it("limits length", () => {
    expect(sanitizeString("a".repeat(100), 10)).toBe("a".repeat(10));
  });
});

describe("sanitizeEmail", () => {
  it("validates and returns email", () => {
    expect(sanitizeEmail("Test@Example.com")).toBe("test@example.com");
  });

  it("returns null for invalid email", () => {
    expect(sanitizeEmail("not-an-email")).toBeNull();
  });
});
```

### Testing Components (non-visual)

```typescript
// src/components/ui/__tests__/skeleton.test.tsx
import { describe, it, expect } from "vitest";
import { Skeleton } from "../skeleton";

// Smoke test: component renders without crashing
describe("Skeleton", () => {
  it("renders without crashing", () => {
    const { container } = render(<Skeleton className="w-20 h-4" />);
    expect(container.firstChild).toBeTruthy();
  });
});
```

---

## 5. Integration Testing Patterns

### Testing API Routes

API route tests test the handler functions directly, avoiding HTTP server startup:

```typescript
// src/app/api/__tests__/register-event-api.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../events/register/route";

// Mock Auth0 session
vi.mock("@auth0/nextjs-auth0", () => ({
  getSession: vi.fn(),
}));

// Mock Supabase
vi.mock("@/utils/supabase/service", () => ({
  createServiceClient: () => ({
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ data: { id: "1" }, error: null }),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { role: "hacker" }, error: null }),
  }),
}));

describe("POST /api/events/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if not authenticated", async () => {
    const { getSession } = await import("@auth0/nextjs-auth0");
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const request = new Request("http://localhost:3000/api/events/register", {
      method: "POST",
      body: JSON.stringify({ eventId: "1" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("registers authenticated user for an event", async () => {
    const { getSession } = await import("@auth0/nextjs-auth0");
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { sub: "auth0|123" },
    });

    const request = new Request("http://localhost:3000/api/events/register", {
      method: "POST",
      body: JSON.stringify({ eventId: "1" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(201);
  });
});
```

### Common Mocks

```typescript
// Mock Auth0 session for tests
vi.mock("@auth0/nextjs-auth0", () => ({
  getSession: vi.fn(),
}));

// Mock Supabase service client for tests
vi.mock("@/utils/supabase/service", () => ({
  createServiceClient: () => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  }),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
  notFound: vi.fn(),
}));
```

---

## 6. E2E Testing Patterns

### Playwright Configuration

Defined in `playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  expect: { timeout: 10000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
```

### E2E Test Example

```typescript
// e2e/smoke.spec.ts
import { test, expect } from "@playwright/test";

test("homepage loads with all sections", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("nav")).toBeVisible();
  await expect(page.locator("footer")).toBeVisible();
  // Check hero section
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // Check navigation links
  await expect(page.getByRole("link", { name: /events/i })).toBeVisible();
});

test("404 page for unknown routes", async ({ page }) => {
  const response = await page.goto("/this-route-does-not-exist");
  expect(response?.status()).toBe(404);
});
```

### Running E2E Tests

```bash
# Run all E2E tests (starts dev server automatically)
npx playwright test

# Run a specific test file
npx playwright test e2e/smoke.spec.ts

# Run with UI mode (interactive)
npx playwright test --ui

# Run headed mode (watch the browser)
npx playwright test --headed
```

---

## 7. What to Test

### Must Test

| Area | Test Level | Examples |
|------|-----------|----------|
| Validation functions | Unit | `sanitizeString`, `sanitizeEmail`, `sanitizeUrl`, `validateSocialUrl` |
| Utility functions | Unit | `cloudinaryUrl`, `getAvatarUrl`, `cn()` (via tailwind-merge) |
| Business logic | Unit/Integration | XP calculations, level thresholds, task board utilities |
| API mutation routes | Integration | CRUD operations, auth checks, validation, error responses |
| API public routes | Integration | Rate limiting, CORS, error responses |
| Server Actions | Integration | Profile updates, event registration, marker issuance |
| Authentication | E2E | Login, logout, callback, session persistence |
| Critical flows | E2E | Event registration, project submission, profile viewing |

### Should Test

| Area | Test Level | Examples |
|------|-----------|----------|
| React components | Unit (smoke) | Rendering, conditional states, empty states |
| Custom hooks | Unit | `usePresence`, `useAnalytics`, `useFocusTrap` |
| Database queries | Integration | Profile resolution, search, pagination |
| Error boundaries | Integration | Error page rendering, error reporting |

### Don't Test (explicitly)

- **Third-party library behavior** — assume Auth0, Supabase, Cloudinary SDKs work correctly
- **CSS/styling details** — visual regression is not part of the current strategy
- **Next.js framework internals** — assume App Router, `next/image`, and `next/font` work correctly
- **Constants and static config** — test the logic that uses them, not the values themselves

---

## 8. Mocking Strategy

| Service | Mock Approach | Example |
|---------|--------------|---------|
| Auth0 | `vi.mock("@auth0/nextjs-auth0")` — mock `getSession` | Return `{ user: { sub: "auth0\|id" } }` or `null` |
| Supabase | `vi.mock("@/utils/supabase/service")` — chain `from().select().eq().single()` | Return `{ data: {...}, error: null }` or `{ data: null, error: {...} }` |
| Cloudinary | Not typically mocked — use `cloudinaryUrl()` which is a pure function | Test the URL transform logic directly |
| Upstash Redis | Rate limiter falls back to allow-all when Redis is unreachable | Tests run without Redis by default |
| Resend (email) | Not typically mocked — test that the email content function works | Test `ghost-marker-notification.ts` output |
| `next/navigation` | `vi.mock("next/navigation")` | Mock `useRouter`, `usePathname`, `notFound` |
| `next/headers` | `vi.mock("next/headers")` | Mock `cookies()`, `headers()` |

---

## 9. Running Tests

```bash
# Run all unit + integration tests
npm run test                        # vitest run

# Run tests in watch mode (development)
npx vitest

# Run a specific test file
npx vitest run src/lib/__tests__/validation.test.ts

# Run with coverage
npx vitest run --coverage

# Run E2E tests
npx playwright test

# Run all checks (pre-merge)
npm run test && npx playwright test && npx tsc --noEmit && npm run lint
```

---

## 10. CI Integration

Tests run automatically on every PR via `.github/workflows/ci.yml`:

```yaml
# Two separate jobs:
test:
  - name: Tests
    run: npx vitest run

e2e:
  - name: E2E Tests
    run: npx playwright test
    # Requires AUTH0_TEST_EMAIL and AUTH0_TEST_PASSWORD
```

The E2E job depends on the `build` job completing first, and requires Auth0 test credentials in GitHub Secrets.

---

## 11. Current Test Inventory

As of the latest build:

| Type | Count | Files |
|------|-------|-------|
| Unit + Integration tests | 876 | 47 test files |
| E2E tests | 6 spec files | `e2e/` directory |

Current coverage is comprehensive for utilities, API routes, and Server Actions. Gaps exist in E2E coverage (auth-dependent tests require credentials) and component-level visual testing.
