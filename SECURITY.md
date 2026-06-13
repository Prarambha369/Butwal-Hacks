# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | ✅                 |
| Older   | ❌                 |

## Reporting a Vulnerability

**Do NOT report security vulnerabilities through public GitHub Issues.**

Butwal Hacks handles authentication (Auth0), database access (Supabase), media uploads (Cloudinary), and email communications (Resend). A disclosed vulnerability in any of these integrations could affect user accounts and data.

### Private Disclosure Process

1. **Email** your findings to **security@butwalhacks.com**
   - Encrypt sensitive details using our PGP key (request one via email).
2. **Include**:
   - A clear description of the vulnerability.
   - Steps to reproduce (PoC or script preferred).
   - Potential impact (what an attacker could gain).
   - Suggested fix (if known).
3. **Response timeline**:
   - **48 hours**: Acknowledgment of receipt.
   - **7 days**: Initial triage and risk assessment.
   - **30 days**: Fix deployed or remediation plan shared.

We aim to resolve **critical** issues within **7 days** and **high** severity issues within **14 days**.

## Security Architecture (3 Layers of Defense)

```
Browser ──► Next.js API Route ──► Auth0 Session Check ──► Zod Validation ──► Supabase (Service Role Key)
  │               │                       │                        │                       │
  │          Rate-limited          Session cookie            Schema parse          Bypasses RLS
  │          (Upstash Redis)       verified                  + sanitize             (server-side only)
  ▼               ▼                       ▼                        ▼                       ▼
Attacker      429 Too Many             401 Unauthorized        400 Bad Request        403 Forbidden
```

### Layer 1: Supabase Service Role Key (Database)
- The `SUPABASE_SERVICE_ROLE_KEY` is **never** exposed to the browser.
- All data writes happen in Next.js API Routes or Server Actions using a server-only Supabase client.
- Attackers cannot write directly to the database — they have no access to the service role key.

### Layer 2: Auth0 Session Validation (API)
- Every mutation API route verifies the Auth0 session cookie before processing.
- Role-based access control (`requireRole()`) ensures users can only access authorized dashboards.

### Layer 3: Zod Input Validation (Data)
- Every POST/PUT route parses input through a Zod schema before touching the database.
- `rejectOversized()` guards against payload size attacks (1 MB limit).
- HTML tags and control characters are stripped via `sanitizeString()`.

## Rate Limiting

All public mutation endpoints are rate-limited via Upstash Redis:
- **5 requests per 60 seconds** per IP (contact form, sponsor inquiries)
- **Higher limits** for authenticated routes (projects, teams, event registration)
- Returns `429 Too Many Requests` with a `Retry-After` header when exceeded

## Dependency Security

- We use `npm audit` in CI to detect vulnerable dependencies.
- Renovate bot (or Dependabot) is configured for automated dependency updates.
- Lockfile (`package-lock.json` at root) is committed and verified in CI.
