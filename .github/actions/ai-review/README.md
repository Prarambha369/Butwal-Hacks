# AI Code Review Action

> A custom GitHub Action that reviews pull requests for security, business logic, and architecture issues. Maintained by the core team.

## What this is

A composite action at `.github/actions/ai-review/` that runs Claude over a pull request diff and posts findings as review comments. It runs automatically on every pull request targeting `main`.

## Who it's for

| Audience | Use it for |
|----------|-----------|
| Contributors | Understanding what the action flags before you push again |
| Maintainers | Interpreting severity levels and adjusting the prompt |

## Quick actions

**Enable it.** Add `ANTHROPIC_API_KEY` to the repository secrets, under Settings, Secrets and variables, Actions, New repository secret. Take the value from `https://console.anthropic.com/`. The workflow fails without it.

**Run it locally** against a diff before opening the PR:

```bash
node .github/actions/ai-review/review.mjs
```

## Reference

### What it checks

| Area | Looks for |
|------|-----------|
| Security | SQL injection, auth bypass, data exposure, SSRF |
| Business logic | Race conditions, missing validation, unhandled edge cases |
| Architecture | N+1 queries, missing error handling, unsafe data flow |
| Critical paths | Anything touching auth, payments, or data deletion |

### Severity levels

| Level | Meaning |
|-------|---------|
| CRITICAL | Blocks merge. Must be fixed |
| WARNING | Informational. Review recommended |
| INFO | Style or suggestion. No action required |

### Files

| File | Purpose |
|------|---------|
| `action.yml` | Action metadata and inputs |
| `review.mjs` | The review script invoked by the workflow |

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Job fails immediately | `ANTHROPIC_API_KEY` is not set | Add it to the repository secrets |
| No comments posted | The diff touched no reviewable files, such as only markdown | Expected; the action skips documentation-only diffs |
| Findings look generic | The diff is very large and was truncated | Split the change so the security-relevant part is reviewable on its own |
| Action cannot comment | The workflow token lacks write permission | Grant `pull-requests: write` to the job |

## See also

- [MAINTAINERS.md](../../../MAINTAINERS.md) — the CI pipeline this action belongs to
- [AGENTS.md](../../../AGENTS.md) — the conventions the review enforces
- [SECURITY.md](../../../SECURITY.md) — the defense layers being checked