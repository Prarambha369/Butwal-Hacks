# Dashboard / Portal IA Audit

Measured inventory of the authenticated segment: `my-app/src/app/(main)/dashboard/` (44 `page.tsx`) and `my-app/src/app/(main)/portal/` (7 `page.tsx`) = **51 routes**. Every cell was read from source; `file:line` refs are relative to `my-app/src/app/(main)/` unless another root is named. Nav layout refs: `H` = `dashboard/hacker/layout.tsx`, `O` = `dashboard/organizer/layout.tsx`, `M` = `dashboard/maintainer/layout.tsx`, `P` = `portal/layout.tsx`.

`robots` column: `noindex` = page declares `robots: {index:false, follow:false}`; `index` = metadata present without a robots key, so `buildPageMetadata` (`src/lib/seo.ts:20`) or the Next default yields `index:true`; `none` = no metadata export at all (client page or missing export). `loading` column: `own` = a `loading.tsx` in that segment, `ancestor` = inherits the nearest ancestor file (`dashboard/loading.tsx` for all dashboard routes, `portal/loading.tsx` for all portal routes).

## 1. Route inventory

| URL | Surface | File | Component | robots | loading | In nav? |
|---|---|---|---|---|---|---|
| /dashboard | shared | dashboard/page.tsx | server | noindex L17 | own | n/a |
| /dashboard/blog | shared | dashboard/blog/page.tsx | server | noindex L14 | ancestor | no |
| /dashboard/profile | shared | dashboard/profile/page.tsx | server | noindex L11 | ancestor | yes (H:44, `PROFILE_SETTINGS_PATH` = `src/lib/routes.ts:18`) |
| /dashboard/onboarding | shared | dashboard/onboarding/page.tsx | server | noindex L11 | ancestor | no |
| /dashboard/sponsor-onboarding | sponsor | dashboard/sponsor-onboarding/page.tsx | server | noindex L10 | ancestor | no |
| /dashboard/projects/new | shared | dashboard/projects/new/page.tsx | server | noindex L7 | ancestor | no |
| /dashboard/projects/[projectId]/edit | shared | dashboard/projects/[projectId]/edit/page.tsx | server | index (generateMetadata L10-21) | ancestor | no |
| /dashboard/hacker | hacker | dashboard/hacker/page.tsx | server | noindex L22 | ancestor | yes (H:38) |
| /dashboard/hacker/work | hacker | dashboard/hacker/work/page.tsx | server | noindex L10 | ancestor | yes (H:50) |
| /dashboard/hacker/projects | hacker | dashboard/hacker/projects/page.tsx | server | noindex L9 | ancestor | yes (H:56) |
| /dashboard/hacker/certificates | hacker | dashboard/hacker/certificates/page.tsx | server | noindex L8 | ancestor | yes (H:62) |
| /dashboard/hacker/team-matching | hacker | dashboard/hacker/team-matching/page.tsx | server | index (generateMetadata L9) | ancestor | yes (H:74) |

| /dashboard/hacker/skills | hacker | dashboard/hacker/skills/page.tsx | server | index L7-8 | ancestor | yes (H:86) |
| /dashboard/hacker/chat | hacker | dashboard/hacker/chat/page.tsx | server | index L7-8 | ancestor | yes (H:92) |
| /dashboard/hacker/teams | hacker | dashboard/hacker/teams/page.tsx | server | noindex L8 | ancestor | no (nav sends to `/teams`, H:68) |
| /dashboard/hacker/profile | hacker | dashboard/hacker/profile/page.tsx | server | noindex L14 | ancestor | no (nav sends to `/dashboard/profile`) |
| /dashboard/organizer | organizer | dashboard/organizer/page.tsx | server | noindex L9 | own | yes (O:28) |
| /dashboard/organizer/events | organizer | dashboard/organizer/events/page.tsx | server | noindex L12 | ancestor | yes (O:34) |
| /dashboard/organizer/events/new | organizer | dashboard/organizer/events/new/page.tsx | server | noindex L5 | ancestor | no (child of Events) |
| /dashboard/organizer/events/[event_id] | organizer | dashboard/organizer/events/[event_id]/page.tsx | server | noindex L28 | ancestor | no (child) |
| /dashboard/organizer/events/[event_id]/attendees | organizer | .../attendees/page.tsx | server | noindex L15 | ancestor | no (child) |
| /dashboard/organizer/events/[event_id]/analytics | organizer | .../analytics/page.tsx | server | noindex L8 | ancestor | no (child) |
| /dashboard/organizer/events/[event_id]/certificates | organizer | .../certificates/page.tsx | server | noindex L16 | ancestor | no (child) |
| /dashboard/organizer/events/[event_id]/photos | organizer | .../photos/page.tsx | server | noindex L8 | ancestor | no (child) |
| /dashboard/organizer/events/[event_id]/teams | organizer | .../teams/page.tsx | server | index L11-14 | ancestor | no (child) |
| /dashboard/organizer/events/[event_id]/scan | organizer | .../scan/page.tsx | server | index L10-13 | ancestor | no (child) |
| /dashboard/organizer/events/[event_id]/qr | organizer | .../qr/page.tsx | server | index L11-14 | ancestor | no (child) |
| /dashboard/organizer/work | organizer | dashboard/organizer/work/page.tsx | server | noindex L9 | ancestor | yes (O:40) |
| /dashboard/organizer/issue-marker | organizer | dashboard/organizer/issue-marker/page.tsx | server | noindex L10 | ancestor | yes (O:46) |
| /dashboard/organizer/certificates/templates | organizer | dashboard/organizer/certificates/templates/page.tsx | server | noindex L17 | ancestor | yes (O:55) |

| /dashboard/maintainer | maintainer | dashboard/maintainer/page.tsx | server | noindex L22 | own | yes (M:37) |
| /dashboard/maintainer/users | maintainer | dashboard/maintainer/users/page.tsx | server | noindex L6 | ancestor | yes (M:43) |
| /dashboard/maintainer/system-check | maintainer | dashboard/maintainer/system-check/page.tsx | server | none | ancestor | yes (M:49) |
| /dashboard/maintainer/audit-log | maintainer | dashboard/maintainer/audit-log/page.tsx | server | index L8-11 | ancestor | yes (M:55) |
| /dashboard/maintainer/trust-override | maintainer | dashboard/maintainer/trust-override/page.tsx | server | index L8-11 | ancestor | yes (M:61) |
| /dashboard/maintainer/site-config | maintainer | dashboard/maintainer/site-config/page.tsx | server | noindex L10 | ancestor | yes (M:67) |
| /dashboard/maintainer/photos | maintainer | dashboard/maintainer/photos/page.tsx | server | noindex L5 | ancestor | yes (M:73) |
| /dashboard/maintainer/partners | maintainer | dashboard/maintainer/partners/page.tsx | server | noindex L5 | ancestor | yes (M:79) |
| /dashboard/maintainer/chapters | maintainer | dashboard/maintainer/chapters/page.tsx | server | noindex L5 | ancestor | yes (M:85) |
| /dashboard/maintainer/blog | maintainer | dashboard/maintainer/blog/page.tsx | server | noindex L5 | ancestor | yes (M:91) |
| /dashboard/maintainer/dedicate-school | maintainer | dashboard/maintainer/dedicate-school/page.tsx | client L1 | none (L30) | ancestor | yes (M:103) |
| /dashboard/maintainer/testimonials | maintainer | dashboard/maintainer/testimonials/page.tsx | server | noindex L6 | ancestor | **no (absent from M array)** |
| /portal/sponsors | portal | portal/sponsors/page.tsx | server | index L14 | ancestor | yes (P:19) |
| /portal/sponsors/company | portal | portal/sponsors/company/page.tsx | server | index L8 | ancestor | yes (P:34) |
| /portal/recruiters | portal | portal/recruiters/page.tsx | server | index L10 | ancestor | yes (P:24) |
| /portal/bounties | portal | portal/bounties/page.tsx | server | index L9 | ancestor | yes (P:29) |
| /portal/bounties/new | portal | portal/bounties/new/page.tsx | server | index L8 | ancestor | no (child) |
| /portal/bounties/[id]/edit | portal | portal/bounties/[id]/edit/page.tsx | server | index (generateMetadata L10-12) | ancestor | no (child) |
| /portal/payouts | portal | portal/payouts/page.tsx | server | index L9 | ancestor | **no (absent from P array)** |

Counts: 51 pages, 49 server / 2 client; 32 `noindex`, 16 `index`, 3 `none` (19 of 51 emit no noindex); 4 routes with their own `loading.tsx` (`/dashboard`, `/dashboard/organizer`, `/dashboard/organizer/api-keys`, `/dashboard/maintainer`), 47 inherited; 30 routes reachable from a nav array, 21 not. `...` rows expand to `dashboard/organizer/events/[event_id]/<child>/page.tsx`.

## 2. Nav duplication

### 2a. `H` `hackerLinks` (H:36-97) - 10 items

| label | href | icon | shortcut | lines |
|---|---|---|---|---|
| Overview | /dashboard/hacker | LayoutDashboard | h | 37-42 |
| My Profile | /dashboard/profile (`src/lib/routes.ts:18`) | User | r | 43-48 |
| Work | /dashboard/hacker/work | KanbanSquare | w | 49-54 |
| Projects | /dashboard/hacker/projects | Code2 | p | 55-60 |
| Certificates | /dashboard/hacker/certificates | FileText | c | 61-66 |
| Teams | **/teams (off-dashboard)** | Users | t | 67-72 |
| AI Team Match | /dashboard/hacker/team-matching | UsersRound | m | 73-78 |

| Skill Trees | /dashboard/hacker/skills | GitBranch | s | 85-90 |
| Team Chat | /dashboard/hacker/chat | MessageSquare | x | 91-96 |

### 2b. `O` `organizerLinks` (O:26-66) - 6 items

| label | href | icon | shortcut | lines |
|---|---|---|---|---|
| Overview | /dashboard/organizer | LayoutDashboard | o | 27-32 |
| Events | /dashboard/organizer/events | CalendarDays | e | 33-38 |
| Team Work | /dashboard/organizer/work | KanbanSquare | w | 39-44 |
| Issue Marker | /dashboard/organizer/issue-marker | MapPin | i | 45-50 |
| Certificate Templates | /dashboard/organizer/certificates/templates | LayoutTemplate | t | 51-59 |


### 2c. `M` `maintainerLinks` (M:35-108) - 12 items

| label | href | icon | shortcut | lines |
|---|---|---|---|---|
| Command Center | /dashboard/maintainer | Terminal | c | 36-41 |
| Users | /dashboard/maintainer/users | Users | u | 42-47 |
| System Check | /dashboard/maintainer/system-check | Stethoscope | k | 48-53 |
| Audit Log | /dashboard/maintainer/audit-log | ScrollText | a | 54-59 |
| Trust Override | /dashboard/maintainer/trust-override | ShieldCheck | t | 60-65 |
| Site Config | /dashboard/maintainer/site-config | Settings2 | s | 66-71 |
| Photos | /dashboard/maintainer/photos | ImageIcon | p | 72-77 |
| Partners | /dashboard/maintainer/partners | Handshake | w | 78-83 |
| Chapters | /dashboard/maintainer/chapters | GraduationCap | h | 84-89 |
| Blog | /dashboard/maintainer/blog | BookOpen | b | 90-95 |
| API Docs | **/api-docs (off-dashboard)** | BookOpen | d | 96-101 |
| Dedicate School | /dashboard/maintainer/dedicate-school | GraduationCap | g | 102-107 |

### 2d. `P` `sponsorLinks` (P:17-38) - 4 items, no shortcuts

| label | href | icon | lines |
|---|---|---|---|
| Overview | /portal/sponsors | LayoutDashboard | 18-22 |
| Discover Hackers | /portal/recruiters | Search | 23-27 |
| Bounties | /portal/bounties | Briefcase | 28-32 |
| Company Profile | /portal/sponsors/company | Building2 | 33-37 |

### 2e. Duplication and type findings  - Shared hrefs across the four arrays: **none**. Shared labels: `Overview` x3 (H:39, O:29, P:20).
- Shortcut collisions across arrays: `c` (H:64 / M:39), `k` (H:82 / O:63 / M:51), `w` (H:52 / O:42 / M:81), `p` (H:58 / M:75), `t` (H:70 / O:57 / M:63), `s` (H:88 / M:69). These collide in practice because `roleRedirect` lets maintainer and organizer enter the hacker tree (H:138) and the palette listens globally (`src/hooks/use-dashboard-shortcuts.ts:18`).
- Off-dashboard hrefs: `/teams` (H:68), `/api-docs` (M:97).
- A fifth copy of the inventory lives in `src/components/dashboard/tool-guide-section.tsx:59-267` (7 hacker + 5 organizer + 7 maintainer + 4 portal hrefs), rendered by `dashboard/page.tsx:6`.
- Only the hacker layout mounts the mobile bottom nav, via `hackerLinks.slice(0,5)` (H:173, H:188). The portal layout renders neither the palette nor a bottom nav (P:70-79).
- Competing types: `NavLink` = `{href,label,icon}` at `src/components/sidebar-config.ts:3-7`, consumed by `DashboardShell` (`src/components/dashboard/shell/dashboard-shell.tsx:39`) and `DashboardSidebar` (`src/components/dashboard-sidebar.tsx:11,23`); `DashboardNavItem` = `{href,label,shortcut,icon}` at `src/components/dashboard-command-palette.tsx:12-17`, consumed by `DashboardNavProvider` (`src/components/dashboard-nav-provider.tsx:7`) and `use-dashboard-shortcuts` (`src/hooks/use-dashboard-shortcuts.ts:5,18`). One array per layout feeds both; `shortcut` is dropped for the sidebar and the portal array has no `shortcut` at all.

## 3. Layout-silo overlap (profile row fetched per request)

| Layout | session | `profiles` select | other queries | predicate called |
|---|---|---|---|---|
| `dashboard/layout.tsx` (root) | L13 | L34-38 (`id`) | RPC `create_profile_with_bh_id` L43 / insert L54 (bootstrap only) | none |
| `H` hacker | L113 | L122-126 (`id, role, slug_id, full_name, bio, socials, trust_markers`) | `chapter_members` count L149-152, `projects` count L155-158 | `roleRedirect` from `src/lib/role-gate.ts:25`, called H:138 |
| `O` organizer | L73 | L77-81 (`id, role, slug_id`) | `events` timeline L93-95 | `organizerRedirect` from `src/lib/dashboard-access.ts:211`, called O:99 |
| `M` maintainer | L115 | L119-123 (`role, slug_id`) | none | `maintainerRedirect` from `src/lib/dashboard-access.ts:92`, called M:132 |
| `P` portal | L45 | L49-53 (`role, slug_id`) | none | `portalRedirect` from `src/lib/dashboard-access.ts:192`, called P:59 |

Profile-row fetches for one request:

| Route | fetches | where |
|---|---|---|
| /dashboard/hacker/work | 3 | root L34, H:122, page `dashboard/hacker/work/page.tsx:23` |
| /dashboard/maintainer/users | 4 | root L34, M:119, `src/lib/actions/admin.ts:16` via `getAllUsers` (admin.ts:274) and via `getPendingRoleRequests` (admin.ts:194), each calling `requireMaintainer` (admin.ts:12-42) |
| /portal/payouts | 2 | P:49, `portal/payouts/page.tsx:19` |
| /dashboard/organizer/events/[event_id] | 2 (+event row) | root L34, O:77; the page fetches no profile (`.../[event_id]/page.tsx:37-47`) |
| /dashboard/maintainer | 2 | root L34, M:119 (page only aggregates) |

Notes: the hacker layout adds two count queries on every hacker route (H:149-158); the organizer layout adds an `events` timeline query on every organizer route (O:93-95). `H` imports its predicate from `role-gate.ts` while `O`/`M`/`P` import from `dashboard-access.ts` (H:6 vs O:24, M:33, P:15); all four are asserted only at source level by `src/app/(main)/dashboard/__tests__/layout-guards.test.ts:56-83`.

## 4. Client/server split

- `"use client"` files: **27** - 23 under `dashboard/`, 4 under `portal/` (`portal/sponsors/company/sponsor-company-form.tsx:1`, `portal/payouts/payouts-client.tsx:1`, `portal/bounties/opportunity-form.tsx:1`, `portal/bounties/opportunities-manager.tsx:1`). Of the 51 pages, **2 are client components**:
  - (API keys page removed — was `dashboard/hacker/api-keys/page.tsx` and `dashboard/organizer/api-keys/page.tsx`.)
  - `dashboard/maintainer/dedicate-school/page.tsx` (L1): form state only plus the `dedicateSchool` server action (L32-58, `src/lib/actions/admin.ts:290`); no browser API. Plausibly a server page wrapping a client `<DedicateSchoolForm>` child; would also restore the metadata export it documents as disabled (L30).
- The other 25 client files are already state-only children (`*-client.tsx`, `*-button.tsx`, `*-editor.tsx` patterns), which is the correct split.

## 5. Service-role call sites (`createServiceClient()`)

34 call sites (30 in `dashboard/`, 4 in `portal/`). "Check" = the guard immediately above the call in the same file.

| file:line | check above it |
|---|---|
| dashboard/layout.tsx:33 | session/dev-bypass redirect L21 |
| dashboard/page.tsx:36 | session redirect L31 |
| dashboard/blog/page.tsx:26 | session redirect L24; profile existence redirect L36 |
| dashboard/sponsor-onboarding/page.tsx:35 | session redirect L28; role allowlist L42 |
| dashboard/onboarding/page.tsx:42 | session redirect L34; non-hacker redirect L52 |
| dashboard/projects/[projectId]/edit/page.tsx:33 | session redirect L31; profile redirect L42; ownership L44+ |
| dashboard/hacker/page.tsx:25 | **guard is below the call**: session resolved L26-27, identity check L33, first query L41 |
| dashboard/hacker/layout.tsx:121 | session L113; `roleRedirect` L138 |
| dashboard/hacker/work/page.tsx:20 | session redirect L16; profile redirect L29 |
| dashboard/hacker/certificates/page.tsx:18 | session guard L16 |
| dashboard/hacker/projects/page.tsx:17 | session redirect L15; profile redirect L25 |
| dashboard/hacker/profile/page.tsx:22 | session redirect L20 |
| dashboard/organizer/layout.tsx:76 | session L73; `organizerRedirect` L99 |
| dashboard/organizer/page.tsx:18 | session redirect L16; profile redirect L27 |
| dashboard/organizer/work/page.tsx:19 | session redirect L15; profile redirect L28 |

| dashboard/organizer/events/page.tsx:20 | session redirect L18 |
| dashboard/organizer/certificates/templates/page.tsx:43 | session redirect L41; `EDITOR_ROLES` check L50 |
| dashboard/organizer/events/[event_id]/page.tsx:37 | **none in file** - no `auth0` import; event fetched by id L39-47, no ownership check |
| dashboard/organizer/events/[event_id]/attendees/page.tsx:42 | session redirect L40, but **no ownership check** - event by id L44-50 |
| dashboard/organizer/events/[event_id]/certificates/page.tsx:32 | session L30; `ISSUER_ROLES` L39; ownership L48 |
| dashboard/organizer/events/[event_id]/photos/page.tsx:19 | **none in file** - no `auth0` import; event by id L20-25 (photo data itself is gated in `src/lib/actions/photos.ts:75-78`) |
| dashboard/organizer/events/[event_id]/teams/page.tsx:22 | **none in file** - no `auth0` import; event existence only L25-31; delegates to `getEventTeams` |
| dashboard/organizer/events/[event_id]/scan/page.tsx:21 | **none in file** - no `auth0` import; event existence only L23-29 |
| dashboard/organizer/events/[event_id]/qr/page.tsx:32 | **none in file** - no `auth0` import; event existence only L34-40 |
| dashboard/maintainer/layout.tsx:118 | session L115; `maintainerRedirect` L132 |
| dashboard/maintainer/page.tsx:27 | **none in file** - no `auth0` import above L27; relies on the `M` layout gate |
| dashboard/maintainer/system-check/page.tsx:58 | session L55; `roleRedirect` L65 |
| dashboard/maintainer/audit-log/page.tsx:24 | session redirect L17 |
| dashboard/maintainer/trust-override/page.tsx:17 | session redirect L15 |
| portal/layout.tsx:48 | session L45; `portalRedirect` L59 |
| portal/sponsors/page.tsx:23 | session redirect L21 |
| portal/payouts/page.tsx:17 | session redirect L15; role allowlist L28 |
| portal/bounties/[id]/edit/page.tsx:21 | session redirect L19; ownership L43-45 |

Findings (reported, not fixed):

1. **No in-file authz above the call (6 sites):** `events/[event_id]/page.tsx:37`, `.../photos/page.tsx:19`, `.../teams/page.tsx:22`, `.../scan/page.tsx:21`, `.../qr/page.tsx:32`, and `maintainer/page.tsx:27`. All six are inside a role layout (`organizerRedirect` O:99 / `maintainerRedirect` M:132), so they are not anonymous-reachable, but none repeats the session or resource check locally.
2. **Missing event-ownership check:** 5 of 7 event children read `events` (and `event_registrations`) by raw `event_id` with only a role gate, while the sibling `.../certificates/page.tsx:48` does check `event.organizer_id !== caller.id`. Cross-organizer read exposure: event title/details, attendee names + emails (`attendees/page.tsx:53-60`), QR roster (`qr/page.tsx:42-45`).
3. **`getEventTeams` has no authz at all:** `src/lib/actions/teams.ts:142-188` reads `teams`, `team_members` and `profiles` (full names, BH-IDs) for any `eventId` with the service role, while its write siblings use `requireEventOrganizer` (teams.ts:198-209). `.../teams/page.tsx:34-37` calls it directly.
4. `dashboard/hacker/page.tsx:25` creates the service client before the identity check (L26-33); the first query (L41) is behind the check, so this is ordering-only, not an open read.

## 6. Test coverage map

Unit (`src/**/__tests__`) - what actually exists:

| Area | Test file | Covers |
|---|---|---|
| Layout guards (source-level) | `src/app/(main)/dashboard/__tests__/layout-guards.test.ts:56-83` | all 4 layouts call their predicate, no truthiness gate, `redirect(blocked)` present |
| Predicate parity (source-level) | `src/lib/__tests__/access-parity.test.ts:43-174` | portal/maintainer/organizer layout delegation + middleware `PORTAL_ROLES` parity |
| Predicates (behaviour) | `src/lib/__tests__/dashboard-access.test.ts`, `src/lib/__tests__/role-gate.test.ts` | `isMaintainer`, `maintainerRedirect`, `organizerRedirect`, `portalRedirect`, `roleRedirect` |
| Route import smoke | `src/__tests__/smoke.test.ts:64-101,125` | 31 dashboard + all 7 portal routes export a default page; `loading.tsx` list has only 1 of our 5 (`smoke.test.ts:168` = `organizer/api-keys`) |
| Middleware role routing | `src/__tests__/proxy.test.ts:145-345,564-582` | `/dashboard`, `/dashboard/hacker`, `/dashboard/maintainer`, `/dashboard/organizer`, `/dashboard/maintainer/audit-log`, `/dashboard/organizer/events` |
| Nav shell / palette | `src/components/dashboard/shell/__tests__/dashboard-shell.test.tsx`, `src/components/__tests__/dashboard-command-palette.test.tsx`, `src/components/__tests__/maintainer-sidebar.test.tsx`, `src/hooks/__tests__/use-dashboard-shortcuts.test.ts` | shell rendering, palette filter/nav, maintainer sidebar, `g+key` shortcuts |
| Scan page | `dashboard/organizer/events/[event_id]/scan/__tests__/qr-scanner-client.test.tsx` | client scanner component only |
| Page behaviours via actions | `src/lib/actions/__tests__/{admin,teams,certificates,events,projects,partners,testimonials,blog,issue-marker,role-selection,skill-trees,team-chat,team-matching,sponsor-opportunities}.test.ts` | the server actions behind maintainer/users, teams, certificates, events, projects, partners, testimonials, blog drafts, issue marker, role selection, skills, chat, team match, bounties |
| Other | `src/lib/__tests__/system-diagnostics.test.ts`, `src/lib/__tests__/blog-drafts.test.ts`, `src/lib/certificates/__tests__/*` | system-check probes, blog drafts, certificate templates/render/export |

E2E (`my-app/e2e/`, 6 specs):

| Spec | Dashboard routes touched |
|---|---|
| `rbac-routing.spec.ts:16-74` | unauthenticated redirects: `/dashboard/hacker`, `/dashboard/maintainer`, `/dashboard/organizer`, `/dashboard/hacker/profile`, `/dashboard/profile`, `/dashboard/hacker/work`, `/portal/sponsors` |
| `kanban-realtime.spec.ts:305-355` | signed-in `/dashboard/hacker/work` |
| `avatar-upload.spec.ts:32-170`, `crop-interaction.spec.ts:33-40` | signed-in `/dashboard/profile` |
| `helpers.ts:44-56` | sign-in lands on `/dashboard/hacker` |
| `smoke.spec.ts`, `task-flow.spec.ts` | no dashboard/portal routes |

**Routes with no route-module test (11):** `/dashboard/blog`, `/dashboard/hacker/skills`, `/dashboard/hacker/chat`, `/dashboard/organizer/certificates/templates`, `.../events/[event_id]/certificates`, `.../photos`, `.../teams`, `.../scan`, `.../qr`, `/dashboard/maintainer/system-check`, `/dashboard/maintainer/testimonials`. Behaviour is still covered indirectly for blog (`src/lib/__tests__/blog-drafts.test.ts`), skills (`actions/__tests__/skill-trees.test.ts`), chat (`actions/__tests__/team-chat.test.ts`), templates (`lib/certificates/__tests__/*` + `actions/__tests__/certificates.test.ts:365`), event certificates (`certificates.test.ts:251,431`), teams (`teams.test.ts:322`), scan (`scan/__tests__/qr-scanner-client.test.tsx`) and system-check (`src/lib/__tests__/system-diagnostics.test.ts`); **`.../photos` and `.../qr` have no test at all**. No signed-in E2E exists for any maintainer, organizer-event, or portal route beyond `rbac-routing.spec.ts`'s unauthenticated redirects.

## 7. Top-3 IA proposals

| # | Proposal | Current cost | Proposed change | Files affected | URL impact |
|---|---|---|---|---|---|
| a | Single typed nav config + sidebar sections | 4 hand-written arrays (32 items: H:36-97, O:26-66, M:35-108, P:17-38) + a 5th copy in `tool-guide-section.tsx:59-267`; two competing types (`sidebar-config.ts:3` vs `dashboard-command-palette.tsx:12`); 6 cross-role shortcut collisions; 21 of 51 routes in no array (incl. `/dashboard/maintainer/testimonials`, `/portal/payouts`) | one `NAV: Record<Role, readonly NavItem[]>` module with `{href,label,icon,shortcut,section}`; layouts, the tool guide, bottom nav and palette all import it; sections (`Overview`, `Manage`, `Off-site`) replace the flat list | `dashboard/hacker/layout.tsx`, `dashboard/organizer/layout.tsx`, `dashboard/maintainer/layout.tsx`, `portal/layout.tsx`, `src/components/sidebar-config.ts`, `src/components/dashboard-command-palette.tsx`, `src/components/dashboard/tool-guide-section.tsx`, tests `dashboard-command-palette.test.tsx`, `maintainer-sidebar.test.tsx`, `layout-guards.test.ts` | **none (phase 1)** |
| b | Event children as a tab strip with real URLs | 7 children linked from a button row inside `dashboard/organizer/events/[event_id]/page.tsx:85-124`, each re-implementing a back link (`.../scan/page.tsx:36-42`, `.../teams/page.tsx:43-45`); no shared active state, and 5 of 7 children read the event with no ownership check (section 5) | a new `events/[event_id]/layout.tsx` rendering `<EventTabs eventId>` (real `href`, `aria-current`) over the existing child URLs; children drop their private back links; ownership predicate applied once in that layout | `dashboard/organizer/events/[event_id]/layout.tsx` (new), `.../[event_id]/page.tsx`, 7 child `page.tsx` files | **none (phase 1)** - all 7 hrefs stay as they are |
| c | `robots` noindex consolidation into layouts | 32 page-level `robots: {index:false,follow:false}` declarations spread over dashboard pages; 19 of 51 routes carry no noindex (16 declare `index:true` via `src/lib/seo.ts:20` or a title-only export - all 7 portal pages + 9 dashboard pages - and 3 have no metadata at all, incl. both client pages); only `src/app/robots.ts:18-19` disallows the whole segment today | export `metadata = { robots: { index:false, follow:false } }` once from `dashboard/layout.tsx` and `portal/layout.tsx` (children inherit and client pages gain it), then delete the per-page copies | `dashboard/layout.tsx`, `portal/layout.tsx`, plus the 32 page files that lose their `robots` line | **none (phase 1)** - identical `noindex` output, fewer places to maintain |
