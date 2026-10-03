# Secret Rotation and Production Cutover Runbook

> Procedure for rotating credentials that were exposed outside the repository. Nothing in this document has been executed.

## What this is

The production Supabase service-role key, the Supabase database password, the Auth0 session secret `AUTH0_SECRET`, a Groq API key, and Postgres connection strings were pasted into a chat conversation. Treat all of them as compromised and rotate them at the source.

The exposure was confined to the conversation, so no history rewrite is needed. Rotating at the source is sufficient and complete.

## Who it's for

| Audience | Use it for |
|----------|-----------|
| Maintainers on call | Working through the rotation under time pressure |
| Anyone handling credentials | Knowing which order the steps must run in |

## Quick actions

**Rotate before merging or deploying the remediation branch.** The branch changes migrations and hardens CI, and `deploy.yml` now fails when `SUPABASE_DB_URL` is missing. The first run after merge will fail unless that GitHub secret already exists. Do step 0 first.

## Reference

### What is not affected

Verified across all commits in `git log --all -p`:

- No Supabase `service_role` JWT in history
- No Groq `gsk_…` key in history
- No password-bearing `postgres://` connection string in history
- No hardcoded `SUPABASE_SERVICE_ROLE_KEY` in history
- `.env` and `.env.local` are gitignored; no env, key, or PEM file is tracked
- The secrets audit action reports no secrets in tracked files

### Ordering constraint

Rotate **before** merging and deploying the remediation branch.

Migration `123_role_requests_pending_unique.sql` is backward compatible with the previous code: the app still does the read-then-write duplicate check and treats the new `23505` as an extra safety net. Applying the migration before or after the deploy is safe either way.

### Step 0 — prerequisite, blocks the first deploy

Generate a strong pooler password and apply it through Supabase SQL:

```bash
# Generate a password; do not print it
NEW_DB_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)
```

Apply it with the Supabase Dashboard SQL editor, or:

```bash
supabase db push --db-url "$SUPABASE_DB_URL" \
  --file <(echo "ALTER ROLE postgres WITH PASSWORD '$NEW_DB_PASSWORD';")
```

Then add the GitHub Actions secret the hardened workflow requires, under Settings, Secrets and variables, Actions, New repository secret:

```text
SUPABASE_DB_URL = postgres://postgres.<project-ref>:<url-encoded-password>@<host>:5432/postgres
```

Until this exists, the `migrate` job exits 1 on purpose. That is intended behavior, not a regression.

Other secrets the workflow reads: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VERCEL_DEPLOY_HOOK_URL`.

### Step 1 — rotate Supabase credentials

Dashboard locations: Project Settings then API for the service-role key, and Project Settings then Database for the password.

In this order:

1. Generate a new database password, as in step 0.
2. Click Reset next to the service-role key to mint a new one.
3. Rebuild `SUPABASE_DB_URL` with the new password.

Rotating the database password invalidates every pooled connection. Existing serverless functions hold a cached connection and error until they recycle, so redeploy after updating Vercel in step 3.

Verify the new key before wiring it anywhere:

```bash
curl -s "$SUPABASE_URL/rest/v1/profiles?select=id&limit=1" \
  -H "apikey: $NEW_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $NEW_SERVICE_ROLE_KEY"
```

Expect 200 and a JSON array. A 401 means the key is wrong, not the URL.

### Step 2 — rotate Auth0 `AUTH0_SECRET`

Dashboard location: Applications, then Applications, then your app, then Settings, then Advanced, then Application Signing Key.

`AUTH0_SECRET` signs the session cookie. Rotating it **logs out every user**. It is unrelated to the M2M client secret.

To rotate the web-app client secret as well: Applications, then Settings, then Client Secret, then Rotate, and update `AUTH0_CLIENT_SECRET` in Vercel in the same sitting.

The Management API client `AUTH0_M2M_CLIENT_SECRET` is used for account linking. Its token cache lives in module scope, so a rotation is picked up on the next cold start; redeploy to be certain.

The M2M app needs these scopes for account linking: `read:users` and `update:users`.

### Step 3 — update Vercel and fix the split-brain config

This is the most important step. Production `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` were added to Vercel by hand. Supabase-managed keys rotate on their own schedule, so a manual copy silently drifts out of sync with the real project key and produces exactly the 401s that were breaking organizer role requests.

1. Open Project, then Settings, then Integrations, then Supabase, then Connect.
2. Confirm the integration reports the intended project ref, not a different project.
3. **Delete** the manually created `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from Settings, Environment Variables, across all three targets: Production, Preview, Development. The integration re-injects them; keeping both copies is what caused the drift.
4. Update `SUPABASE_DB_URL`, if Vercel holds a copy, to the new password.
5. Redeploy so pooled connections pick up the new database password.

Verify afterwards:

```bash
vercel env ls <project-id>
```

Both variables should be listed as integration-managed, or absent from the manual list entirely.

### Step 4 — rotate the Groq key

In the Groq console, open API Keys, create a new key, then revoke the old one. Update `GROQ_API_KEY` in Vercel.

### Step 5 — connect the GitHub integration

Optional but recommended. In Supabase, open Settings, Integrations, GitHub, then Connect. This gives branch previews and lets `supabase db push` run from CI against linked branches.

### Step 6 — verify

```bash
# 1. Migrations applied and re-runnable
supabase db push --db-url "$SUPABASE_DB_URL"
supabase migration list --db-url "$SUPABASE_DB_URL"

# 2. The new partial unique index exists
psql "$SUPABASE_DB_URL" -c "\di idx_role_requests_one_pending_per_role"

# 3. The service-role key reaches PostgREST; this is the organizer-request path
curl -s -o /dev/null -w '%{http_code}\n' \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/role_requests?select=id&limit=1" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"

# 4. Deploy health
curl -s -o /dev/null -w '%{http_code}\n' https://butwalhacks.com/
```

Then, in a browser as a signed-in organizer, request a role upgrade and confirm the Supabase cache-sync path no longer returns 401. Errors now surface in Sentry under the `role-selection` and `auth0/link/*` tags instead of a generic toast.

### Why the app is now diagnosable

The original symptom, "Failed to submit request" with no detail, came from three separate problems that all produced the same message.

| Problem | Fix |
|---------|-----|
| The duplicate-check query's error was destructured away, so a failed read looked identical to "no duplicate" | `role-selection.ts` inspects it and fails closed |
| Every PostgREST failure collapsed to one string | `src/lib/supabase-error.ts` maps codes such as `42501`, `PGRST205`, `23505`, and `SUPABASE_NOT_CONFIGURED` to distinct messages |
| `logger.error` went to the console only | `src/lib/logger.ts` forwards `error` level to Sentry with an `errorId` |

A repeat of this failure is now identifiable from the toast text alone.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| The `migrate` job exits 1 immediately after merge | `SUPABASE_DB_URL` is not set as a GitHub secret | Complete step 0 |
| Migration step fails with a DDL error | The URL points at a transaction pooler | Rebuild it on port 5432 direct or session pooler |
| Organizer role requests return 401 in production only | A manual Vercel env drifted from the Supabase integration | Complete step 3 |
| Organizer requests fail with "permission denied" | RLS is active where service role was expected | Confirm the request uses `createServiceClient()` |
| Users are logged out unexpectedly | `AUTH0_SECRET` was rotated | Expected; sessions cannot survive it |
| M2M account linking 401s after rotation | The module-scope token cache is stale | Redeploy to force a cold start |

## See also

- [MAINTAINERS.md](../MAINTAINERS.md) — where each secret is configured
- [SECURITY.md](../SECURITY.md) — the defense layers this rotation protects
- [docs/ARCHITECTURE.md](ARCHITECTURE.md) — the trust boundaries involved
- [AGENTS.md](../AGENTS.md) — the authorization rule a service-role query must follow
