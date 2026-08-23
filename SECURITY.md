# Security Policy

## Reporting a Vulnerability

Do NOT report security vulnerabilities through public GitHub Issues.

Email findings to: **security@butwalhacks.com**

Include:
- A clear description of the vulnerability
- Steps to reproduce (PoC or script preferred)
- Potential impact
- Suggested fix (if known)

Response timeline:
- 48 hours: Acknowledgment of receipt
- 7 days: Initial triage and risk assessment
- 30 days: Fix deployed or remediation plan shared

## Defense Layers

### Layer 1: Auth0 Edge Middleware
Every API route verifies the Auth0 session cookie before processing. Role-based access control ensures users can only access authorized dashboards.

### Layer 2: Zod API Validation
Every POST/PUT route parses input through a Zod schema before touching the database. `rejectOversized()` guards against payload size attacks (1 MB limit). HTML tags and control characters are stripped.

### Layer 3: Supabase Service Role Key Isolation
The Service Role Key is never exposed to the browser. All data writes happen in Next.js API Routes or Server Actions using a server-only Supabase client. Attackers cannot write directly to the database.

## Rate Limiting

All public mutation endpoints are rate-limited via Upstash Redis:
- 5 requests per 60 seconds per IP (contact form, sponsor inquiries)
- Higher limits for authenticated routes (projects, teams, event registration)
- Returns 429 Too Many Requests with a Retry-After header when exceeded

## Dependency Security

- `npm audit` runs in CI to detect vulnerable dependencies
- Lockfile (`package-lock.json`) is committed and verified in CI
