# AI Code Review Action

Custom GitHub Action that uses Claude to review PRs for architecture, security, and business logic issues.

## Setup

1. Add `ANTHROPIC_API_KEY` to your GitHub repository secrets:
   - Go to Settings → Secrets and variables → Actions → New repository secret
   - Name: `ANTHROPIC_API_KEY`
   - Value: Your Anthropic API key from https://console.anthropic.com/

2. The action runs automatically on every PR to `main`.

## What it checks

- **Security**: SQL injection, auth bypass, data exposure, SSRF
- **Business logic**: Race conditions, missing validation, edge cases
- **Architecture**: N+1 queries, missing error handling, unsafe data flow
- **Critical path**: Anything touching auth, payments, or data deletion

## Severity levels

- **CRITICAL**: Blocks merge. Must be fixed.
- **WARNING**: Informational. Review recommended.
- **INFO**: Style/suggestion. No action required.
