# User Stories — Butwal Hacks

Every feature mapped to a role, a goal, and a navigation flow. All flows end at a route in the 9-Zone architecture.

---

## Role: Hacker (Student Builder)

A student or young technologist who participates in events, earns credentials, and builds projects.

### Core Identity

**Goal:** Claim and customize my Hacker ID profile.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/` or marketing page | Click "Sign Up" |
| 2 | `/auth/login?screen_hint=signup` | Authenticate via Auth0 (Google, GitHub, or email) |
| 3 | `/claim/[token]` | Claim ghost profile if invited, or auto-create profile |
| 4 | `/dashboard/hacker/profile` | Edit name, bio, avatar, social links, skills |
| 5 | `/p/[slug_id]` | View public-facing profile |

**Acceptance:** Profile is publicly viewable at `/p/[slug_id]`. Avatar shows on profile and nav bar. Social links validate against platform (GitHub, LinkedIn, Twitter, website).

---

### Event Registration

**Goal:** Register for a hackathon or workshop.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/events` | Browse upcoming events |
| 2 | `/events/[slug]` | View event details (date, location, description) |
| 3 | Click "Register" | POST `/api/events/register` |
| 4 | `/dashboard/hacker` | See registered event in upcoming section |

**Acceptance:** Registration creates a row in `event_registrations`. "Register" button changes to "Registered". Organizer can see attendee in event dashboard.

---

### Team Formation

**Goal:** Form a team with other hackers for a team event.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/events/[slug]` | View event, click "Find Team" |
| 2 | `/teams/create` | Create team with name + description |
| 3 | `/teams/[id]` | Share team invite link with other hackers |
| 4 | Recipient clicks invite | Joins team, appears in member list |

**Acceptance:** Team is stored in `teams` table. Members stored in `team_members`. One member marked as captain. Teams are scoped to an event.

---

### Project Submission

**Goal:** Submit a project for judging and portfolio.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/dashboard/hacker/projects` | Click "Submit Project" |
| 2 | `/projects/new` | Fill project details (title, description, tech stack, category) |
| 3 | Upload cover image | Cloudinary upload via signed signature |
| 4 | Link GitHub repo | POST `/api/github/sync` verifies and imports repo metadata |
| 5 | Submit | POST `/api/projects` |
| 6 | `/dashboard/hacker/projects` | See project listed with status |

**Acceptance:** Project stored in `projects` table. Cover image stored via Cloudinary. GitHub metadata (stars, forks, topics) synced if linked.

---

### Team Matching

**Goal:** Find teammates with complementary skills.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/dashboard/hacker/team-matching` | View suggested teammates |
| 2 | See matching score and skills | Click on a suggested hacker |
| 3 | `/p/[bh_id]` | View their public profile and skills |
| 4 | Back to team-matching | Send invite or message |

**Acceptance:** Suggestions based on skill complementarity (Groq AI for Phase 2, explicit skills for Phase 1).

---

### Work Distribution (Kanban)

**Goal:** Manage tasks within a team workspace.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/dashboard/hacker/work` | View Kanban board |
| 2 | Drag task | Task status updates in real-time via Supabase Realtime |
| 3 | Click task | Opens detail drawer (description, assignee, priority, due date) |
| 4 | Edit inline | PATCH `/api/tasks/[id]` |
| 5 | Create task | POST `/api/tasks` with workspace context |

**Acceptance:** Tasks persist in `tasks` table. Board has 4 columns: To Do, In Progress, Review, Done. Real-time updates via Realtime subscriptions.

---

### Credential Verification

**Goal:** Verify a trust marker I earned is cryptographically signed.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/p/[slug_id]` | View trust markers on my profile |
| 2 | Click verified badge | Navigate to `/verify/[markerId]` |
| 3 | See signature details | Ed25519 verification, issuer, date, event |

**Acceptance:** Verified badges show red glow. Self-reported badges show standard border. Revoked badges show strikethrough. Verification page shows signature trail.

---

## Role: Organizer (Volunteer)

A volunteer who runs events, issues trust markers, and manages programs.

### Event Creation

**Goal:** Create a hackathon or workshop.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/dashboard/organizer` | Click "Create Event" |
| 2 | `/dashboard/organizer/events/new` | Fill event form (title, dates, description, banner) |
| 3 | Upload banner | Cloudinary upload with metadata tags |
| 4 | Set visibility | Published or draft |
| 5 | Submit | Event appears on `/events` |

**Acceptance:** Event stored in `events` table. Banner on Cloudinary tagged with event ID. Draft events only visible to organizer.

---

### Check-In Attendees

**Goal:** Verify a hacker attended my event.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/dashboard/organizer/events/[event_id]` | View event detail |
| 2 | Open check-in | `/dashboard/organizer/events/[event_id]/scan` or `/qr` |
| 3 | Scan hacker's QR code | POST `/api/events/checkin` marks attendance |
| 4 | `/dashboard/organizer/events/[event_id]/attendees` | View checked-in attendees |

**Acceptance:** Attendees table stores check-in status. Exportable to CSV via `/api/events/[eventId]/export-certificates`.

---

### Issue Trust Markers

**Goal:** Issue a verified credential to a hacker.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/dashboard/organizer/issue-marker` | Fill marker form |
| 2 | Select hacker (by BH-ID or email) | Search profiles |
| 3 | Select event context | Dropdown of events I organize |
| 4 | Choose marker type | Skill badge, participation, winner, etc. |
| 5 | Submit | POST `/api/v1/issue-marker` creates signed trust marker |

**Acceptance:** Marker stored in `trust_markers` table with Ed25519 signature. Hacker sees badge on their public profile. Ghost profiles: email sent via Resend to claim.

---

### Export Certificates

**Goal:** Generate certificates for all attendees.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/dashboard/organizer/events/[event_id]` | View event |
| 2 | Click "Export Certificates" | GET `/api/events/[eventId]/export-certificates` |
| 3 | PDF generation | Server-side PDF via `@/lib/pdf/certificate-export.ts` |
| 4 | Download | One PDF per attendee or batch |

**Acceptance:** Certificates include hacker name, event name, date, and verification QR code.

---

## Role: Maintainer (Core Team)

A core team member with god-mode access to audit, moderation, and system administration.

### Audit Log

**Goal:** Review all system actions for security.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/dashboard/maintainer` | View system overview |
| 2 | `/dashboard/maintainer/audit-log` | View full audit log |
| 3 | Filter by action type, date, actor | GET `/api/audit?action=issue-marker&date=2026-07` |
| 4 | Click entry | See JSON metadata of the action |

**Acceptance:** All state-changing actions logged to `audit_logs` table. Filterable by action type, actor, target, and date range.

---

### Trust Marker Override

**Goal:** Revoke a fraudulent or incorrect trust marker.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/dashboard/maintainer/trust-override` | Search for marker or profile |
| 2 | Find marker ID or hacker profile | `/p/[slug_id]` shows all markers |
| 3 | Click "Revoke" | Requires confirmation modal |
| 4 | Enter reason | POST to API, marker marked as revoked |

**Acceptance:** Revoked markers show `line-through` on public profiles. Audit log records revocation with reason. Crypto signature is invalidated.

---

### School Dedication

**Goal:** Dedicate a public profile to a specific school.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/dashboard/maintainer/dedicate-school` | Search for hacker profile |
| 2 | Enter school name | Links profile to a school chapter |
| 3 | Submit | Profile shows school affiliation badge |

**Acceptance:** School appears on public profile. School chapter page lists all dedicated hackers.

---

### User Management

**Goal:** View and manage all platform users.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/dashboard/maintainer/users` | View paginated user table |
| 2 | Filter by role, status, school | Client-side filtering |
| 3 | Click user | Edit role, suspend, delete |
| 4 | Confirm action | Audit log entry created |

**Acceptance:** All users visible. Role changes logged. Suspended users cannot log in.

---

## Role: Sponsor / Recruiter (Partner)

An organization that searches for talent, posts bounties, and manages sponsorships.

### Talent Search

**Goal:** Find hackers with specific skills for hiring.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/portal/recruiters` | Search interface |
| 2 | Filter by skills, location, event participation | GET `/api/search?skills=react,typescript&events=HackDay` |
| 3 | View hacker profiles | `/p/[slug_id]` with trust markers |
| 4 | Contact via platform | POST `/api/contact` (rate-limited) |

**Acceptance:** Search returns ranked profiles. Results show verified trust markers prominently.

---

### Bounty Management

**Goal:** Post a paid bounty for a specific project or skill.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/portal/bounties/new` | Fill bounty form (title, description, reward amount) |
| 2 | Set requirements | Required skills, deliverable format |
| 3 | Submit | POST `/api/bounties` |
| 4 | `/portal/bounties` | View active bounties with submissions |

**Acceptance:** Bounties stored in `sponsor_opportunities` table. Hackers can submit via Open Collective integration.

---

## Role: Guest (Unregistered Visitor)

A visitor exploring the platform before signing up.

### Browse Events

**Goal:** See what events are available.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/` | Landing page hero shows upcoming events |
| 2 | `/events` | Full event list with filters |
| 3 | `/events/[slug]` | Event detail page |
| 4 | Click "Register" | Redirected to `/auth/login` |

**Acceptance:** All public routes accessible without authentication. Auth-required actions redirect to login.

---

### Explore Community

**Goal:** Discover hackers and their projects.

| Step | Route | Action |
|------|-------|--------|
| 1 | `/explore` | Search/browse hacker directory |
| 2 | Filter by skills, school | Client-side filtering |
| 3 | Click hacker | `/p/[slug_id]` public profile |
| 4 | `/projects` | Browse public project showcase |

**Acceptance:** Public profiles show at minimum: name, avatar, bio, BH-ID. Projects show cover image, tech stack, and demo link.

---

### View Trust Marker Verification

**Goal:** Verify a credential someone shared with me.

| Step | Route | Action |
|------|-------|--------|
| 1 | Receive link | `/verify/[markerId]` |
| 2 | Page shows marker details | Type, title, issuer, issue date, crypto signature |
| 3 | Verification badge | Shows "Verified" with red glow or "Revoked" with strikethrough |
| 4 | Copy embed code | `<iframe>` widget for external sites |

**Acceptance:** Verification page is publicly accessible (no auth required). Widget embed works on any external site via `/widget/[slugId]`.
