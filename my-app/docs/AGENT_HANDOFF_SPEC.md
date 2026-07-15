# Butwal Hacks Agent Handoff Spec

## 1-3: Scope Clarity
- **MVP Phase 1:** Full platform pivot. Landing page redesign (Kloner.app aesthetic), public hacker profiles, Auth0 flow, and Notion-style work distribution for teams.
- **Public vs Private:** Anyone can view public Hacker ID profiles (`/p/[slug_id]`) and the marketing site without logging in. Users MUST have an account to interact, join teams, submit projects, or use the work board.
- **Subdomain Routing:** `butwalhacks.com` is for marketing/public profiles. `app.butwalhacks.com` is for all dashboards and API routes. The Edge middleware must enforce this.

## 4-6: Design Consistency
- **Aesthetic:** Pivoting away from "Liquid Glass" to a **Kloner.app-inspired aesthetic**. Flat, structured, modern SaaS. Pure white/light gray backgrounds, deep charcoal text, crisp 1px borders, NO backdrop-blur.
- **Components:** Refactor existing `ui/card.tsx`, `ui/button.tsx`, and `ui/badge.tsx` to match this flat, bordered style. Use `Inter` for body, `JetBrains Mono` for IDs/dates.
- **Color Palette:** Background `#FFFFFF` / `#F7F7F8`. Text `#1F1F1F`. Borders `#E5E5E5`. Butwal Red `#FE0000` used SPARINGLY (only for primary CTAs and verified Trust Marker glows).

## 7-9: Data Layer & Auth
- **Auth Strategy (Crucial):** Auth0 handles 100% of authentication. Do NOT use Supabase Auth. Do NOT duplicate user data. 
- **Supabase Role:** Supabase acts strictly as a database via the Service Role Key (RLS disabled). The `profiles` table stores a `auth0_user_id` and the ORCID-style `slug_id` (e.g., `BH-24-001`). Auth0 webhooks sync new users to this table.
- **Schema:** Existing tables (`profiles`, `events`, `trust_markers`, `projects`, `teams`). Create new `tasks` and `workspaces` tables for the Notion-style work distribution feature. 
- **Seed Data:** Create 3 dummy hackathons, 5 sample hackers (with mixed roles), and 3 verified Trust Markers for demo purposes.

## 10-12: Feature Integration
- **Landing Page:** Hero + Impact Metrics + Bento Feature Grid + FAQ + CTA + Footer. Must be perfectly responsive (1440px desktop, 390px mobile).
- **Notion-Style Work Board:** `/dashboard/hacker/work`. Kanban view (To Do, In Progress, Review, Done) with drag-and-drop. Task cards must have assignee, priority, and due date.
- **Email/Notifications:** Contact forms and feedback/reporting use Resend for official emails and Slack webhooks for internal team notifications. No welcome email yet.
- **AI:** BH Bot (Groq Llama 3) is dashboard-only for now. Do not put AI on the landing page.

## 13-15: DevOps & Delivery
- **Environment Variables (`.env.example`):** 
  - `NEXT_PUBLIC_SITE_URL`: Set to `https://butwalhacks.com` for prod, `http://localhost:3000` for dev.
  - `AUTH0_SECRET`, `AUTH0_ISSUER_BASE_URL`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`: From Auth0 dashboard.
  - `SUPABASE_SERVICE_ROLE_KEY`: MUST be server-side only. Never prefix with `NEXT_PUBLIC_`.
  - `CLOUDINARY_API_SECRET`: Server-side only.
  - `UPSTASH_REDIS_REST_URL` / `TOKEN`: For rate limiting.
  - `RESEND_API_KEY` & `SLACK_WEBHOOK_URL`: For notifications.
- **CI/CD ($0 Tech Stack):** Use GitHub Actions (Free Tier). Create `.github/workflows/ci.yml` to run `npm run lint`, `npm run build`, and `npm audit` on every PR. No paid CI/CD tools.
- **Deployment:** Manual Vercel deploys are OK for now, but the GitHub Action must pass before merging to `main`. 
- **Git Strategy:** Commit work to a `feature/kloner-pivot-and-workboard` branch. Create a PR for review.

## Deadline
- Ready for review: ASAP. Execute autonomously using the Agentic Loop (Check -> Verify -> Test -> Build).
