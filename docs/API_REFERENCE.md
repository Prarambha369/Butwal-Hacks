# API Reference

## Public REST API

Endpoints listed below are accessible without authentication unless noted otherwise.

### `POST /api/v1/issue-marker`

Issue a trust marker (credential) to a hacker.

**Auth:** Organizer or Maintainer session required.

**Request:**
```json
{
  "profile_id": "auth0|abc123",
  "title": "Best Web App - Hackathon 2024",
  "description": "Awarded for building the most impressive web application",
  "category": "achievement"
}
```

**Response (201):**
```json
{
  "success": true,
  "marker": {
    "id": "marker-uuid",
    "slug_id": "BH-24-001",
    "title": "Best Web App - Hackathon 2024",
    "signature": "base64-ed25519-signature"
  }
}
```

---

### `GET /api/v1/profile/[slug_id]`

Fetch a public hacker profile.

**Auth:** None (public).

**Response (200):**
```json
{
  "bh_id": "BH-24-001",
  "full_name": "Jane Doe",
  "bio": "Full-stack developer passionate about edtech",
  "avatar_url": "https://res.cloudinary.com/...",
  "role": "Hacker",
  "trust_markers": [
    {
      "id": "marker-uuid",
      "title": "Best Web App - Hackathon 2024",
      "verified": "Verified",
      "signature": "base64-ed25519-signature"
    }
  ],
  "skills": ["React", "Node.js", "TypeScript"],
  "socials": {
    "github": "https://github.com/janedoe",
    "linkedin": "https://linkedin.com/in/janedoe"
  }
}
```

---

### `GET /api/v1/api-keys` **(Authenticated)**

List API keys for the authenticated user.

**Auth:** Authenticated user session required.

**Response (200):**
```json
{
  "keys": [
    {
      "id": "key-uuid",
      "prefix": "bhk_abc...",
      "created_at": "2024-01-01T00:00:00Z",
      "last_used_at": null
    }
  ]
}
```

---

### `POST /api/v1/api-keys` **(Authenticated)**

Generate a new API key.

**Auth:** Authenticated user session required.

**Request:**
```json
{
  "name": "My Portfolio Site"
}
```

**Response (201):**
```json
{
  "key": "bhk_generated-full-key",
  "id": "key-uuid"
}
```

> **Note:** The full key is only shown once on creation.

---

## Webhooks

### `POST /api/webhooks/auth0`

Receives Auth0 user events (signup, profile update).

**Auth:** Validated via `AUTH0_WEBHOOK_SECRET`.

**Events handled:**
- `user.signup` - Creates a new profile in Supabase with BH-ID.
- `user.update` - Syncs profile changes.
- `user.delete` - Marks profile as suspended.

**Response (200):**
```json
{
  "success": true,
  "profile_id": "auth0|abc123",
  "bh_id": "BH-24-001"
}
```

---

### `POST /api/webhooks/opencollective`

Receives Open Collective payment events (donations, bounties).

**Auth:** Not yet verified (see [`OC_WEBHOOK_SECRET` issue](https://github.com/Prarambha369/Butwal-Hacks/issues)).

**Events handled:**
- `expense.paid` - Processes bounty payouts, awards XP to hacker.
- `donation.created` - Tracks donations on `/transparency` page.

**Response (200):**
```json
{
  "success": true,
  "event": "expense.paid"
}
```

---

### `POST /api/webhooks/proxy`

Forwards platform events to Slack/Discord via configured webhook URLs.

**Auth:** Validated via `CRON_SECRET`.

**Events forwarded:**
- Event registrations
- Marker issuances
- Project submissions

---

## Internal API Routes

These are used by the frontend and are documented for contribution purposes.

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/events` | GET/POST | List/create events |
| `/api/events/register` | POST | Register for an event |
| `/api/events/checkin` | POST | Organizer check-in |
| `/api/events/[eventId]/registrations` | GET | List event registrations |
| `/api/events/[eventId]/export-certificates` | GET | Export certificates as PDF |
| `/api/events/ical` | GET | Export events as iCal feed |
| `/api/projects` | GET/POST | List/submit projects |
| `/api/projects/like` | POST | Like/unlike a project |
| `/api/teams` | GET/POST | List/create teams |
| `/api/contact` | POST | Submit contact form |
| `/api/sponsor` | POST | Submit sponsor inquiry |
| `/api/reviews` | POST | Submit event review |
| `/api/resources/complete` | POST | Mark resource as completed |
| `/api/github/sync` | POST | Sync GitHub repos metadata |
| `/api/github/deep-sync` | POST | Deep sync: commits + README |
| `/api/badges/check` | POST | Check badge eligibility |
| `/api/ai/chat` | POST | AI assistant chat (BH Bot) |
| `/api/ai/pitch-generator` | POST | AI project pitch generator |
| `/api/certificates` | GET | List user certificates |
| `/api/certificates/extract` | POST | OCR certificate extraction |
| `/api/profile/complete` | POST | Complete profile onboarding |
| `/api/profile/update` | PATCH | Update profile fields |
| `/api/auth/link/initiate` | POST | Initiate account linking |
| `/api/auth/link/callback` | POST | Complete account linking |
| `/api/auth/link/status` | GET | Check link status |
| `/api/auth/link/unlink` | POST | Unlink a connected account |
| `/api/tasks` | GET/POST | List/create tasks |
| `/api/tasks/[id]` | PATCH/DELETE | Update/delete task |
| `/api/workspaces` | GET/POST | List/create workspaces |
| `/api/search` | POST | Full-text search across platform |
| `/api/health` | GET | Health check (DB + Redis) |
| `/api/keep-alive` | GET | Cron job keep-alive |
| `/api/metrics` | GET | Platform metrics |
| `/api/notifications` | GET | List user notifications |
| `/api/bounties` | GET | List sponsor bounties |
| `/api/skill-trees` | GET/POST | List/create skill trees |
| `/api/organizer/metrics` | GET | Organizer dashboard metrics |
| `/api/admin/annual-report` | GET | Annual report generation |
| `/api/impact/report/[projectId]` | GET | Project impact report |
| `/api/verify/[bhId]` | GET | Public BH-ID verification |
| `/api/verify/[bhId]/embed` | GET | Embeddable verification widget |
| `/api/cloudinary-signature` | POST | Generate Cloudinary upload signature |

---

## Rate Limiting

All public mutation endpoints are rate-limited via Upstash Redis:

| Endpoint | Limit |
|----------|-------|
| `/api/contact` | 5 req/min per IP |
| `/api/sponsor` | 5 req/min per IP |
| `/api/events/register` | 10 req/min per user |
| `/api/projects` | 10 req/min per user |
| All others | 30 req/min per user |

Exceeded limits return `429 Too Many Requests` with a `Retry-After` header.
