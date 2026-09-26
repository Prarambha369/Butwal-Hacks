# Secret Rotation & Production Cutover Runbook

**Status: ACTION REQUIRED — nothing in this document has been executed.**

The production Supabase service-role key, the Supabase database password, the
Auth0 session secret (`AUTH0_SECRET`), a Groq API key, and Postgres connection
strings were pasted into a chat conversation. Treat all of them as compromised.

## What is *not* affected

Verified 2026-09-26 across all 311 commits in `git log --all -p`:

- No Supabase `service_role` JWT in history
- No Groq (`gsk_…`) key in history
- No password-bearing `postgres://` connection string in history
- No hardcoded `SUPABASE_SERVICE_ROLE_KEY` in history
- `.env` / `.env.local` are gitignored; no env, key, or PEM file is tracked
- `.github/actions/secrets-audit/audit.mjs` → "No secrets found in tracked files"

**The exposure was confined to the conversation, so no history rewrite is
needed.** Rotating at the source is sufficient and complete.

---

## ⚠️ Ordering constraint

Rotate **before** merging/deploying the remediation branch.

The branch changes migrations and hardens CI. `deploy.yml` now *fails* when
`SUPABASE_DB_URL` is missing, so the very first run after merge will fail unless
that GitHub Actions secret already exists. Do step 0 first.

Migration `123_role_requests_pending_unique.sql` is backward compatible with the
previous code: the app still does the read-then-write duplicate check and only
treats the new `23505` as an extra safety net. Applying the migration before or
after the deploy is safe either way.

---

## Step 0 — Prerequisite (blocks the first deploy)

Generate a strong pooler password and apply it via Supabase SQL:

```bash
# Generate a password (do not print it)
NEW_DB_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)

# Apply via Supabase SQL (do not print the password)
# Use the Supabase Dashboard SQL editor or:
# supabase db push --db-url "$SUPABASE_DB_URL" --file <(echo "ALTER ROLE postgres WITH PASSWORD '$NEW_DB_PASSWORD';")
```

Then add the GitHub Actions secret the hardened workflow now requires:

```
Settings → Secrets and variables → Actions → New repository secret
  SUPABASE_DB_URL   = postgres://postgres.ieagwnhsgjtbqlwptgei:<url-encoded-password>@aws-1-ap-south-1:5432/postgres
```

Until this exists, `migrate` exits 1 on purpose (`.github/workflows/deploy.yml`).
That is the intended behaviour, not a regression.

Other secrets the workflow reads: `NEXT_PUBLIC_SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `VERCEL_DEPLOY_HOOK_URL`.

---

## Step 1 — Rotate Supabase credentials

Dashboard: **Project Settings → API** (service-role key) and
**Project Settings → Database** (password).

Rotate in this order:

1. Generate a new database password (see Step 0).
2. Click **Reset** next to the service-role key to mint a new one.
3. Rebuild `SUPABASE_DB_URL` with the new password.

> Rotating the DB password invalidates every pooled connection. Existing
> serverless functions keep a cached connection and will error until they
> recycle — redeploy after updating Vercel env (step 3) to clear it.

Verify the new key works before wiring it anywhere:

```bash
curl -s "$SUPABASE_URL/rest/v1/profiles?select=id&limit=1" \
  -H "apikey: $NEW_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $NEW_SERVICE_ROLE_KEY"
```

Expect `200` and a JSON array. A `401` means the key is wrong, not the URL.

---

## Step 2 — Rotate Auth0 `AUTH0_SECRET`

Dashboard: **Applications → Applications → your app → Settings → Advanced →
Application Signing Key**.

`AUTH0_SECRET` signs the session cookie. Rotating it **logs out every user**.
It is unrelated to the Auth0 M2M client secret.

If you also want to rotate the web-app client secret
(`AUTH0_CLIENT_SECRET`): Applications → Settings → Client Secret → Rotate, then
update `AUTH0_CLIENT_SECRET` in Vercel in the same sitting.

The Management API client (`AUTH0_M2M_CLIENT_SECRET`) is used by account
linking. Its token cache lives in module scope, so a rotation is picked up on
the next cold start — redeploy to be certain.

Confirm the M2M app still has the scopes account linking needs:

- `read:users`
- `update:users`

---

## Step 3 — Update Vercel, and fix the split-brain config

⚠️ **The most important step.** Production `NEXT_PUBLIC_SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` were added to Vercel **by hand**. Supabase-managed
keys rotate on their own schedule, so a manual copy silently drifts out of sync
with the real project key and produces exactly the `401`s that were breaking
organizer role requests.

1. Project → **Settings → Integrations → Supabase → Connect**.
2. Confirm the integration reports the project ref
   `ieagwnhsgjtbqlwptgei` (not a different project).
3. **Delete** the manually-created `NEXT_PUBLIC_SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY` from **Settings → Environment Variables** for
   all three targets (Production, Preview, Development). The integration
   re-injects them; keeping both copies is what caused the drift.
4. Update `SUPABASE_DB_URL` (if Vercel holds a copy) to the new password.
5. Redeploy so pooled connections pick up the new DB password.

Verify afterwards:

```bash
vercel env ls <project-id>
```

`NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` should be listed as
integration-managed, or absent from the manual list entirely.

---

## Step 4 — Rotate the Groq key

Groq console → API Keys → create a new key → revoke the old one. Update
`GROQ_API_KEY` in Vercel.

---

## Step 5 — Connect the GitHub integration (optional but recommended)

Supabase → **Settings → Integrations → GitHub → Connect**. This gives branch
previews and lets `supabase db push` run from CI against linked branches.

---

## Step 6 — Verify

```bash
# 1. Migrations applied and re-runnable
supabase db push --db-url "$SUPABASE_DB_URL"   # expect: no pending migrations
supabase migration list --db-url "$SUPABASE_DB_URL"

# 2. The new partial unique index exists
psql "$SUPABASE_DB_URL" -c "\di idx_role_requests_one_pending_per_role"

# 3. Service-role key reaches PostgREST (this is the organizer-request path)
curl -s -o /dev/null -w '%{http_code}\n' \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/role_requests?select=id&limit=1" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"

# 4. Health of the deploy
curl -s -o /dev/null -w '%{http_code}\n' https://butwalhacks.com/
```

Then, in the browser, as a signed-in **organizer**: request a role upgrade, and
confirm the Supabase cache-sync path no longer 401s. Errors now surface in
Sentry (the `role-selection` / `auth0/link/*` tags) instead of a generic toast.

---

## Why the app is now diagnosable

The original symptom — "Failed to submit request" with no detail — was caused by
three separate problems that all produced the same generic message:

| Problem | Fix |
| --- | --- |
| The duplicate-check query's error was destructured away, so a failed read looked identical to "no duplicate" | `role-selection.ts` now inspects it and fails closed |
| Every PostgREST failure collapsed to one string | `src/lib/supabase-error.ts` maps codes (`42501`, `PGRST205`, `23505`, `SUPABASE_NOT_CONFIGURED`, …) to distinct messages |
| `logger.error` went to console only | `src/lib/logger.ts` forwards `error` level to Sentry with an `errorId` |

So a repeat of this failure is now identifiable from the toast text alone —
`"This feature is being set up"` means a stale PostgREST schema cache,
`"You do not have permission to do that"` means RLS, and a Supabase-unconfigured
message means the integration is not wired.
