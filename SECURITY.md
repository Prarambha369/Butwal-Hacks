# Security Policy

> How to report a vulnerability in Butwal Hacks, and what defenses are already in place. Maintained by the core team.

## What this is

The disclosure process for security issues in the Butwal Hacks platform, plus a summary of the defenses that guard it. Reporting a vulnerability is welcome and will not be treated as an hostile act.

## Who it's for

| Audience | Use it for |
|----------|-----------|
| Security researchers | Reporting a finding privately |
| Contributors | Knowing which controls a change must not weaken |
| Maintainers | The on-call response for a reported issue |

## Quick actions

**Report a vulnerability.** Do not open a public GitHub issue. Email **security@butwalhacks.com** with:

- a clear description of the vulnerability
- steps to reproduce; a proof-of-concept or script is preferred
- the potential impact
- a suggested fix, if you have one

## Reference

### Response timeline

| Stage | Target |
|-------|--------|
| Acknowledgment of receipt | 48 hours |
| Initial triage and risk assessment | 7 days |
| Fix deployed, or a remediation plan shared | 30 days |

### Defense layers

| Layer | Control |
|-------|---------|
| Identity | Every protected route verifies the Auth0 session before processing. Role predicates in `src/lib/dashboard-access.ts` decide which dashboard a session may reach |
| Input validation | Every mutating route parses its body through a Zod schema before touching the database. `rejectOversized()` rejects payloads over 1 MB. HTML tags and control characters are stripped |
| Database isolation | The Supabase Service Role Key never reaches the browser. All writes happen in route handlers or server actions through a server-only client |
| Rate limiting | Public mutation endpoints are limited through Upstash Redis. Exceeding a limit returns 429 with a `Retry-After` header |
| Webhooks | Inbound webhooks verify an `X-Webhook-Secret` header, and the Open Collective webhook additionally verifies its signature |
| Response headers | A Content-Security-Policy, including per-route `frame-ancestors`, is set in `next.config.ts` |
| Secrets | Server-only environment variables. A secrets audit runs in CI and on every commit |

### Rate limit tiers

| Tier | Limit | Typical use |
|------|-------|-------------|
| `sensitive` | 3 per 60s | Contact form, sponsor inquiries |
| `public_form` | 5 per 60s | Public submissions |
| `user_action` | 5 per 60s | Authenticated single actions |
| `frequent` | 10 per 60s | Autosaving and polling |
| `bulk` | 30 per 60s | Batch operations |

The limiter fails open when Redis is unreachable, so an Upstash outage degrades to no rate limiting rather than an outage.

### Dependency security

- `npm audit --audit-level=high` runs in CI.
- `package-lock.json` is committed and is the source of truth for installed versions.
- No `--force` installs. If a transitive conflict appears, resolve it with an override in the root `package.json` rather than skipping peer checks.
- The pre-commit hook runs a secrets audit over the staged diff.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `npm audit` reports a high-severity advisory | A direct or transitive dependency is affected | Update the dependency; do not suppress the advisory |
| Secrets audit fails on a PR | A credential-shaped string is in the diff | Remove it and rotate the credential; see [docs/SECRET_ROTATION_RUNBOOK.md](docs/SECRET_ROTATION_RUNBOOK.md) |
| A route accepts unauthenticated writes | A `createServiceClient()` call has no authorization check above it | Add the check. See [AGENTS.md](AGENTS.md) |
| Rate limiting seems inactive | Redis is unreachable and the limiter failed open | Check `UPSTASH_REDIS_REST_URL` and quota |

## See also

- [AGENTS.md](AGENTS.md) — access-control rules every change must follow
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — threat model and security architecture
- [MAINTAINERS.md](MAINTAINERS.md) — secrets inventory and on-call runbook
- [docs/SECRET_ROTATION_RUNBOOK.md](docs/SECRET_ROTATION_RUNBOOK.md) — rotating exposed credentials