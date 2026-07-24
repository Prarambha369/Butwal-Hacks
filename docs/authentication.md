# Authentication — Butwal Hacks

**Current auth provider: Auth0** (Regular Web Application)

## Architecture

```
User → /auth/login → Auth0 Hosted Login → Callback: /auth/callback
                                              ↓
                                Auth0 Post-Login Action
                                              ↓
                              POST /api/webhooks/auth0
                                              ↓
                              Supabase profiles table (created/updated)
```

- **Auth0 SDK**: `@auth0/nextjs-auth0` v4
- **Auth routes**: Mounted at `/auth/*` via `src/proxy.ts` middleware (NOT route handlers)
- **Database sync**: Auth0 Post-Login Action calls `/api/webhooks/auth0` to create/update Supabase profiles
- **Supabase**: Used as a database only — no Supabase Auth. Service role key bypasses RLS.
- **RBAC**: 3 roles — `hacker`, `organizer`, `maintainer` — stored in `profiles.role`

---

## Setup

### 1. Auth0 Application

Create a **Regular Web Application** in Auth0 Dashboard:

| Setting | Development | Production |
|---|---|---|
| **Allowed Callback URLs** | `http://localhost:3000/auth/callback` | `https://butwalhacks.com/auth/callback` |
| **Allowed Logout URLs** | `http://localhost:3000` | `https://butwalhacks.com` |
| **Allowed Web Origins** | `http://localhost:3000` | `https://butwalhacks.com` |

> ⚠️ The path is `/auth/callback`, NOT `/api/auth/callback`. Auth0 SDK v4 mounts routes at `/auth/*` via the middleware proxy (`src/proxy.ts`).

### 2. Environment Variables

```env
AUTH0_SECRET=<openssl rand -hex 32>
AUTH0_DOMAIN=auth.butwalhacks.com
AUTH0_CLIENT_ID=<from Auth0 Application>
AUTH0_CLIENT_SECRET=<from Auth0 Application>
AUTH0_BASE_URL=http://localhost:3000  # or https://butwalhacks.com in production
```

> A full `.env.example` with every service (Supabase, Cloudinary, Upstash, Resend, PostHog, Groq, Axiom, R2, cron secrets, webhook proxies, and read replicas) is available at `my-app/.env.example`.

### 3. Post-Login Action

Create an Action in Auth0 Dashboard → Actions → Flows → Login:

```js
exports.onExecutePostLogin = async (event, api) => {
  // Read base URL from Auth0 Action secrets (set in Dashboard → Actions → Secrets).
  // Defaults to production URL if secret is not configured.
  const baseUrl = event.secrets.BASE_URL || 'https://butwalhacks.com';
  const webhookSecret = event.secrets.AUTH0_WEBHOOK_SECRET;

  const headers = { 'Content-Type': 'application/json' };

  // Include webhook secret if configured (for production signature verification).
  if (webhookSecret) {
    headers['X-Webhook-Secret'] = webhookSecret;
  }

  try {
    const response = await fetch(`${baseUrl}/api/webhooks/auth0`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sub: event.user.user_id,
        email: event.user.email,
        name: event.user.name || event.user.nickname || event.user.given_name || '',
      }),
    });

    if (!response.ok) {
      console.error(
        `[auth0-action] Webhook returned ${response.status}: ${await response.text()}`
      );
    }
  } catch (err) {
    console.error('[auth0-action] Failed to call webhook:', err instanceof Error ? err.message : String(err));
  }
};
```

#### How to configure Secrets

1. Go to **[Actions → Secrets](https://manage.auth0.com/#/actions/secrets)** in Auth0 Dashboard
2. Add the following secrets:

| Secret | Dev Value | Production Value | Required |
|--------|-----------|-----------------|----------|
| `BASE_URL` | `http://localhost:3000` | `https://butwalhacks.com` | No (falls back to prod) |
| `AUTH0_WEBHOOK_SECRET` | *(leave empty in dev)* | `<openssl rand -hex 32>` | No (optional signature) |

3. Click **Save**

> ⚠️ If `BASE_URL` is not set, the Action defaults to the production URL. For local development, **you must set `BASE_URL=http://localhost:3000`** or your dev login will sync to the production database.

Without this Action, new users will not get a Supabase profile and will redirect in a loop after login.

---

#### Webhook signature verification (production only)

The `/api/webhooks/auth0` endpoint currently does **not** verify the incoming webhook secret. To enable verification:

1. Set `AUTH0_WEBHOOK_SECRET` in the Auth0 Action's Secrets (see above)
2. Set `AUTH0_WEBHOOK_SECRET` in your app's environment variables
3. The webhook handler will compare the `X-Webhook-Secret` header against the env var

---

## Auth Flows

### Sign In
- Client: Links to `/sign-in`, which redirects to `/auth/login`
- Auth0 SDK handles the OAuth2 flow
- On success, Auth0 redirects to `/auth/callback`
- The proxy middleware completes the session, then redirects to `/dashboard`

### Sign Up
- Client: Links to `/sign-up`, which redirects to `/auth/login?screen_hint=signup`
- Auth0 shows the sign-up form

### Sign Out
- Client: Links to `/sign-out`, which redirects to `/auth/logout`
- Auth0 clears the session, redirects to the homepage

### Account Linking (Connect GitHub, LinkedIn, Google)

Users can link multiple Auth0 identities to their primary account. This lets them sign in with any connected provider and auto-populates social profile URLs.

```
User clicks "Connect GitHub" → POST /api/auth/link/initiate { provider: "github" }
                                  ↓
                          Returns Auth0 authorization URL
                                  ↓
                          User redirected to Auth0 login (GitHub OAuth)
                                  ↓
                          Auth0 redirects to GET /api/auth/link/callback?code=...&state=...
                                  ↓
                          Code exchanged for tokens
                                  ↓
                          Auth0 Management API: link identities
                                  ↓
                          Supabase: linked_accounts + socials updated
                                  ↓
                          Redirect to /dashboard/hacker/profile?linked=success:GitHub
```

#### API Routes

| Route | Method | Purpose | Rate Limit |
|-------|--------|---------|------------|
| `/api/auth/link/status` | GET | Get linked accounts for current user | None (read-only) |
| `/api/auth/link/initiate` | POST | Start linking flow, returns Auth0 URL | `sensitive` (3/min) |
| `/api/auth/link/callback` | GET | Handle OAuth callback, link identities | None (redirect target) |
| `/api/auth/link/unlink` | POST | Disconnect a linked account | `sensitive` (3/min) |

#### Supported Providers

| Provider | `provider` value | Auto-populates social URL |
|----------|-----------------|--------------------------|
| GitHub | `github` | `https://github.com/{nickname}` |
| LinkedIn | `linkedin` | `https://linkedin.com/in/{vanity}` (if non-numeric) |
| Google | `google-oauth2` | No (no profile URL) |

#### Data Storage

Linked accounts are stored in two places:

1. **Auth0 Management API** — authoritative source. Identities are linked via `POST /api/v2/users/{id}/identities`.
2. **Supabase `profiles.linked_accounts`** (JSONB column) — cached copy for fast reads when the Management API is unavailable.

When a user links GitHub or LinkedIn, the corresponding social URL is also auto-populated in `profiles.socials` (only if the field is currently empty).

#### Auth0 Configuration Required

**1. Social Connections** — Enable in Auth0 Dashboard > Authentication > Social:
- GitHub (requires GitHub OAuth app credentials)
- LinkedIn (requires LinkedIn developer app credentials)
- Google (uses built-in Google credentials from Auth0)

**2. M2M Application for Management API** — Create in Auth0 Dashboard > Applications > Machine to Machine:
- Select "Auth0 Management API" as the API
- Grant scopes: `read:users`, `update:users`
- Copy the Client ID and Client Secret

**3. Allowed Callback URLs** — Add to your Auth0 Application settings:
- `http://localhost:3000/api/auth/link/callback` (dev)
- `https://app.butwalhacks.com/api/auth/link/callback` (production)
- Also keep the existing `/auth/callback` for the main login flow

**4. Environment Variables** — Add to `.env.local`:
```env
AUTH0_MGMT_CLIENT_ID=<from M2M application>
AUTH0_MGMT_CLIENT_SECRET=<from M2M application>
```

#### Code Flows

**Initiate linking (client-side):**
```ts
// User clicks "Connect GitHub"
const res = await fetch("/api/auth/link/initiate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ provider: "github" }),
});
const { url } = await res.json();
window.location.href = url;  // Redirect to Auth0
```

**Check status (client-side):**
```ts
const res = await fetch("/api/auth/link/status");
const { linkedAccounts } = await res.json();
// linkedAccounts = [{ provider, user_id, email, name, linked_at }, ...]
```

**Unlink (client-side):**
```ts
await fetch("/api/auth/link/unlink", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ provider: "github", user_id: "12345" }),
});
```

#### Security

- CSRF protected via state cookies (random nonce + primary user ID, stored in httpOnly cookie)
- State cookie has 10-minute TTL
- Rate limited at `sensitive` tier (3 req/min) for initiate and unlink
- Auth0 Management API uses M2M credentials with `read:users` and `update:users` scopes only
- Unlink blocked if only one linked account remains (prevents lockout)

---

## Code Patterns

### Server Component (getting session)

```ts
import { auth0 } from "@/lib/auth0";

const session = await auth0.getSession();
if (!session?.user) redirect("/auth/login");
const userId = session.user.sub;
```

### Server Action (authenticated)

```ts
"use server";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase/service";

export async function myAction() {
  const session = await auth0.getSession();
  if (!session?.user) throw new Error("Unauthorized");
  const userId = session.user.sub;
  // ...
}
```

### Client Component (check auth state)

```ts
"use client";
import { useUser } from "@auth0/nextjs-auth0/client";

function MyComponent() {
  const { user } = useUser();
  const isSignedIn = !!user;
  // ...
}
```

### API Route (authenticated)

```ts
import { auth0 } from "@/lib/auth0";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ...
}
```

---

## Webhook Handlers

| Route | Trigger | Purpose |
|---|---|---|
| `POST /api/webhooks/auth0` | Auth0 Post-Login Action | Sync user to Supabase profiles |
| `POST /api/webhooks/proxy` | External services | Forwards events to Slack/Discord |
| `POST /api/open-collective/webhook` | Open Collective | Bounty payout events |

---

## Session Details

- **Auth0 session cookie**: HttpOnly, secure, same-site
- **Session data**: `user.sub` is the Auth0 user ID (`auth0|...`) — used as the foreign key to `profiles.auth0_user_id`
- **No Supabase Auth sessions**: Supabase is accessed via the service role key for writes and the anon key for reads

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| "Unknown client" error | Client ID doesn't match any Auth0 Application | Create new Application, get fresh Client ID and Secret |
| "redirect_uri_mismatch" | Callback URL in Auth0 doesn't match | Check: should be `/auth/callback` not `/api/auth/callback` |
| Login succeeds, redirects in a loop | Post-Login Action not firing → no profile created | Check Actions → Flows → Login — is the action applied? |
| Profile page shows "Unauthorized" | No Supabase profile for Auth0 user | Check webhook logs in Auth0 |
| Local login redirects to production | `AUTH0_BASE_URL` is set to production URL | Set to `http://localhost:3000` for local dev |
