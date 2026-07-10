# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Butwal Hacks Next.js App Router project. The project already had PostHog infrastructure in place (`PostHogProvider`, `useAnalytics` hook, `captureServerEvent`/`identifyServerUser` utilities, and `posthog-js`/`posthog-node` installed). The wizard extended this by wiring 13 business-critical events across 12 files, covering the full user journey: signup → profile completion → event registration → attendance → project submission → team creation → resource learning → inbound leads.

Environment variables `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` were written to `my-app/.env.local`.

## Events instrumented

| Event name | Description | File |
|---|---|---|
| `user_signed_up` | A new user profile is created for the first time via the Auth0 webhook. | `src/app/api/webhooks/auth0/route.ts` |
| `profile_completed` | A hacker completes or updates their onboarding profile. | `src/app/api/profile/complete/route.ts` |
| `event_registered` | A user successfully registers for a hackathon event. | `src/app/api/events/register/route.ts` |
| `event_checkin_toggled` | An organizer toggles the check-in status for an event attendee. | `src/app/api/events/checkin/route.ts` |
| `event_review_submitted` | A hacker submits a star rating review for an event they attended. | `src/app/api/reviews/route.ts` |
| `event_created` | An organizer successfully creates a new chapter event. | `src/components/organizer/org-event-creation-form.tsx` |
| `project_created` | A hacker submits a new project to the gallery. | `src/app/api/projects/route.ts` |
| `project_liked` | A user likes or unlikes a project in the gallery. | `src/app/api/projects/like/route.ts` |
| `team_created` | A hacker creates a new team, optionally for a specific event. | `src/app/api/teams/route.ts` |
| `resource_completed` | A hacker marks a learning resource as completed. | `src/app/api/resources/complete/route.ts` |
| `github_sync_completed` | A hacker syncs their GitHub repositories to their project portfolio. | `src/app/api/github/sync/route.ts` |
| `contact_form_submitted` | A visitor submits the contact form. | `src/app/api/contact/route.ts` |
| `sponsor_inquiry_submitted` | A company submits a sponsorship inquiry for a specific tier. | `src/app/api/sponsor/route.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard**: [Analytics basics (wizard)](https://eu.posthog.com/project/219907/dashboard/806409)
- [New user signups (wizard)](https://eu.posthog.com/project/219907/insights/vqc2DqHb) — weekly bar chart of new signups
- [Hackathon registration-to-attendance funnel (wizard)](https://eu.posthog.com/project/219907/insights/mvbXL2JY) — conversion funnel from event registration to check-in
- [Project submissions over time (wizard)](https://eu.posthog.com/project/219907/insights/9za7UcH9) — weekly line chart of project gallery submissions
- [Inbound leads — contact and sponsor inquiries (wizard)](https://eu.posthog.com/project/219907/insights/U9WizLNq) — contact form and sponsor inquiry submissions side by side
- [Hacker engagement — teams and resources (wizard)](https://eu.posthog.com/project/219907/insights/1qIpMT2B) — team creation and resource completion as engagement signals

## Verify before merging

- [ ] Run a full production build (`npm run build`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env.example` and any onboarding scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.
- [ ] Confirm the returning-visitor path also calls `identify` — the existing `PostHogProvider` identifies on every `user.sub` change, but verify returning sessions on page refresh are correctly identified before the first event fires.

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
