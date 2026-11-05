# Security remediation — October 2026

**Scope:** P0/P1 authorization defects and access-control hardening, remediated 2026-10-16.
**Update — 2026-11-05:** the Auth0 webhook no longer uses a static bearer; it
is HMAC-SHA256 keyed on the shared secret, with a five-minute freshness window.
Apply those notes below wherever this document discusses the webhook.

This report deliberately avoids file and line references and task-level
internals. It records what was found, what changed, and what remains open, so
the remediation is auditable without turning the repository into an attack map.

---

## 1. Verified findings

Severity reflects **exploitability in the deployed configuration**, before the fix.

| # | Severity | Finding | Subsystem | Disposition |
|---|----------|---------|-----------|-------------|
| 1 | **Critical** | Self-service maintainer escalation | Role assignment | Fixed + proven |
| 2 | **Critical** | Role approval gated on role alone | Role approval | Fixed + proven |
| 3 | **Critical** | Cross-user profile write | Profile update | Fixed + proven |
| 4 | **Critical** | Credential issuance had no issuer check | Trust markers | Fixed + proven |
| 5 | **High** | Background admin check weaker than every UI gate | Admin actions | Fixed + proven |
| 6 | **High** | Webhook failed open when unconfigured | Open Collective webhook | Fixed + proven |
| 7 | **High** | Unfiltered webhook mutation could deactivate an arbitrary bounty | Open Collective webhook | Fixed + proven |
| 8 | **High** | Filter injection in public search | Search route | Fixed + proven |
| 9 | **Medium** | Badge check referenced a nonexistent column | Badges | Fixed + proven |
| 10 | **Medium** | Resource completion referenced a nonexistent column | Resources | Fixed + proven |
| 11 | **Medium** | Impact report had no object-level authorization | Impact reporting | Fixed + proven |
| 12 | **Medium** | Middleware failed open on database error | Proxy gate | Fixed + proven |
| 13 | **Low** | Rate limiter failed open silently | Rate limiter | Made observable |
| 14 | — | Shared secret on Auth0 webhook (see §5) | Auth0 webhook | **Resolved 2026-11-05** — see update above |

### Findings that did not reproduce

| Reported finding | Verdict |
|---|---|
| Auth0 webhook skips verification when unconfigured | Already correct: fail-closed with no configured secret. |
| A `NEXT_PUBLIC_*` Groq key reaching the client bundle | Variable exists only in git-ignored local env; not referenced by app source; not shipped. |
| `is_banned` never enforced | **Column does not exist.** Feature is broken rather than unenforced — see §4. |

---

## 2. What changed

1. **Role assignment is a decision, not a preference.** Self-assignment is limited to the default role; privileged roles go through explicit approval or the Auth0 role-sync webhook. An account attribute is no longer sufficient evidence to grant staff.
2. **One maintainer predicate, used everywhere.** A single `isMaintainer()` predicate now covers layouts, proxy, admin actions and role-approval paths, derived from the Auth0 session (email + verified flag + profile role).
3. **Caller identity is derived, never supplied.** Profile updates no longer accept a subject parameter from the client; the target comes from the session.
4. **Credential issuance requires an issuer check.** A valid privileged role on a personal or unverified address no longer satisfies the issuance path.
5. **Webhooks fail closed on their real gate.** Missing secrets return 503 in production; forged payloads with bounty-ambiguous identifiers are refused.
6. **Search terms are values, not filter syntax.** Banned delimiters are rejected; the permitted alphabet covers letters, digits, spaces and safe punctuation, plus Devanagari for the bilingual directory.
7. **Two permanently-broken routes now work.** Badge check and resource completion resolved their profile rows before writing, and return 404 for profiles that do not exist instead of 500 for every caller.
8. **Object-level authorization on impact reports.** Project owner, team members, the owning event's organizer, or staff only; otherwise null, surfaced as 404.
9. **Proxy fails closed.** A lookup failure denies rather than admits, for the duration of any database incident.
10. **Rate limiting is no longer silent.** The fail-open behaviour is retained deliberately (availability), but now logs at error level so silence is distinguishable from inaction.

## 3. Verification

| Gate | Result |
|------|--------|
| Typecheck | pass, exit 0, no diagnostics |
| Lint | pass, exit 0, 0 errors, 0 warnings |
| Test | pass |
| Build | pass, exit 0 |
| Secrets audit | pass, nothing found |
| Dependency audit | pass — 0 high-severity vulnerabilities |

Regression tests were validated against the vulnerable code by reverting each fix
individually and re-running the suite; a test that cannot fail is not a guard.

## 4. Findings requiring a decision, not a code change

- **`profiles.is_banned` does not exist.** `toggleBanUser()` writes a column that is absent from every migration and from production. Banning is an idea that was never landed. Decide: implement it with a numbered migration and a single authorization predicate (`accessSubjectFor`), or remove the code path.
- **`verifyApiKey()` has no call sites.** Keys can be minted but authenticate nothing. Either wire it or document issuance as ceremonial.
- **Non-atomic profile/ID resolution under concurrency.** A `MAX+1` pattern exists where migration 088 exists to replace it; first-time logins in the same second can collide. Move to the atomic path.
- **Production schema drift.** At least one migration has not been applied in production; repair through a reviewed migration process, never by adding duplicate columns.

## 5. Deliberately not changed — resolved 2026-11-05

Originally, the Auth0 webhook used a shared static secret compared constant-time,
with no nonce or signature; a captured request could be replayed indefinitely.

**Update — 2026-11-05.** The webhook now requires an HMAC-SHA256 signature
over `<unix-seconds>.<raw-request-body>`, verified against a five-minute
freshness window and compared constant-time. A verified caller is authenticated
by possession of the rotated secret; a stale, mismatched or tampered request is
rejected. The action on the Auth0 side sends the signature; the application side
verifies it. Anyone holding a captured request cannot replay it past the window.

## 6. Residual risk

| Risk | Severity | Why it remains |
|------|----------|----------------|
| Rate limiter is IP-keyed and fails open | Medium | Deliberate availability trade; now observable |
| No ban/suspension enforcement | Medium | Column does not exist — see §4 |
| Unverified JWT claims cached as social URLs | Low | Mitigated at link time; TLS plus revalidation |
| Chapter-subdomain rewrite does not check the registrable domain | Low | Contained by Vercel domain configuration |
| Production schema drift | Medium | Needs a reviewed migration process |

## 7. Rollback

Each fix is independently revertable; the behaviour-tightening ones (session-derived identity, verified-email staff check, self-assignment limited to the default role) were staged explicitly because they exclude existing unverified staff from admin paths. Roll back the predicates in source control and re-deploy; the layout gate remains as the second line.
