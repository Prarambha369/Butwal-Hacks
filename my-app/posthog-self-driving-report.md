# PostHog Self-driving Setup Report

_Generated 2026-07-09 for project Default project (id: 219907)_

## Summary

PostHog Self-driving has been configured for the Butwal-Hacks site. Session Replay, Error Tracking, and Support (Conversations) were enabled as products; five signal sources were wired to the inbox; the GitHub App was connected; GitHub Issues for `Butwal-Hacks/Site` was synced as a warehouse source; and a five-scout troop (three built-in, two custom) was tuned. Findings will start appearing in the Self-driving inbox within ~30 minutes: https://eu.posthog.com/project/219907/inbox

---

## AI data processing

**Approved.** Organization-level AI data processing consent was granted before this run started.

---

## GitHub

**Connected during this run.** GitHub App installed on the `Butwal-Hacks` organization (integration id: 70000, display name: Butwal-Hacks). The App grants Self-driving code access for researching findings and opening fixes.

---

## Products enabled

The `products-enable` API endpoint was not accessible via this MCP key's scopes. The three products were not flipped server-side during this run. **Manual follow-up required** — see Follow-ups.

The client-side `posthog.init` in `src/components/posthog-provider.tsx` was checked:
- No `disable_session_recording: true` — session replay server flip will take effect automatically once enabled.
- No `capture_exceptions: false` — error tracking server flip will take effect automatically once enabled.
- Dev mode calls `ph.opt_out_capturing()` — correct and intentional; not a blocker.

| Product | Status |
|---|---|
| Session Replay | Not enabled this run — manual follow-up needed |
| Error Tracking | Not enabled this run — manual follow-up needed |
| Support (Conversations) | Not enabled this run — manual follow-up needed; tickets only arrive once an inbound channel (email / inbox / Slack) is connected in PostHog |

---

## Signal sources

All six sources were new rows (inbox had zero configs before this run).

| source_product | source_type | Action |
|---|---|---|
| `error_tracking` | `issue_created` | **Enabled** (id: 019f4717-5c7b-…) |
| `error_tracking` | `issue_reopened` | **Enabled** (id: 019f4717-5fa1-…) |
| `error_tracking` | `issue_spiking` | **Enabled** (id: 019f4717-6322-…) |
| `session_replay` | `session_analysis_cluster` | **Enabled** (id: 019f4717-6d98-…, server-injected sample_rate: 0.1) |
| `conversations` | `ticket` | **Enabled** (id: 019f4717-7358-…; dormant until an inbound channel is connected) |
| `github` | `issue` | **Enabled** (id: 019f4719-dff9-…) |
| `signals_scout` | `cross_source_issue` | **Skipped** — on by default; creating a row opts out, so no row was created |

---

## Connected tools

| Tool | Status |
|---|---|
| GitHub Issues | **Connected by this setup** — warehouse source created for `Butwal-Hacks/Site` (source id: 019f4719-c979-…); `issues` table syncing incrementally on `updated_at`; first sync started. Only the `issues` table is syncing — additional tables (PRs, commits, etc.) can be enabled in the PostHog data management UI. |
| Linear | **Not used** — not selected |
| Zendesk | **Not used** — not selected |
| pganalyze | **Not used** — not selected |

---

## Scout troop

**5 scouts enabled, 22 disabled.**

### Enabled

| Scout | Reason |
|---|---|
| `signals-scout-general` | Always on — cross-product correlations and surfaces no specialist covers |
| `signals-scout-web-analytics` | Primary instrumentation is pageviews (`$pageview` captured on every route change in `posthog-provider.tsx`) — web traffic is the most active surface |
| `signals-scout-observability-gaps` | First-run setup with no existing insights; this cross-product scout will flag event volumes with no insight or alert coverage |
| `signals-scout-feedback-health` | **Custom** — watches `feedback_submitted` events (confirmed in `src/lib/actions/feedback.ts`) |
| `signals-scout-bounty-pipeline` | **Custom** — watches `bounty_completed` events (confirmed in `src/app/api/open-collective/webhook/route.ts`) |

### Disabled

| Scout | Reason |
|---|---|
| `signals-scout-error-tracking` | Covered by native `error_tracking` signal source (step 4) — duplicate |
| `signals-scout-session-replay` | Covered by native `session_replay` signal source (step 4) — duplicate |
| `signals-scout-ai-observability` | No LLM usage or `$ai_*` events found |
| `signals-scout-anomaly-detection` | Not among top-2 specialists; no dashboards or insights yet |
| `signals-scout-apm` | No OpenTelemetry/tracing in this project |
| `signals-scout-csp-violations` | No PostHog CSP reporting configured |
| `signals-scout-customer-analytics` | No group/accounts analytics |
| `signals-scout-data-pipelines` | No CDP destinations or hog flows |
| `signals-scout-data-warehouse` | Not among top-2 specialists; enable later if GitHub sync health becomes a concern |
| `signals-scout-experiments` | No active A/B experiments |
| `signals-scout-feature-flags` | No confirmed flag usage found in code scan |
| `signals-scout-health-checks` | Not among top-2 specialists |
| `signals-scout-inbox-validation` | Fresh setup — no shipped fixes to validate yet |
| `signals-scout-insight-alerts` | No configured insight alerts |
| `signals-scout-logs` | PostHog logs product not in use |
| `signals-scout-mcp-tool-calls` | No `$mcp_tool_call` telemetry |
| `signals-scout-product-analytics` | No saved funnels or retention flows yet |
| `signals-scout-replay-vision` | No Replay Vision scanners configured |
| `signals-scout-revenue-analytics` | No payment SDK (no Stripe, Paddle, etc.) |
| `signals-scout-skills-store` | Not relevant to primary use case |
| `signals-scout-surveys` | No active surveys (count: 0) |
| `signals-scout-web-vitals` | No `$web_vitals` events confirmed |

To re-enable a disabled scout later: find it in PostHog → Self-driving → Scouts and toggle it on. To switch a noisy scout to dry-run without disabling it: set `emit: false` on its config row.

---

## Custom scouts

### `signals-scout-feedback-health`

**Surface:** `feedback_submitted` event in `src/lib/actions/feedback.ts`. Properties: `category` (bug/feature/improvement/other), `message_length`, `is_authenticated`.

**Discriminator:** (1) Daily submission volume drops >60% below the 14-day rolling average — suggests a broken form or downed route. (2) Share of `bug`-category submissions doubles within any 3-day window — correlates with a regression.

**Why no built-in covers it:** `signals-scout-web-analytics` watches `$pageview` traffic, not custom server-side events. `signals-scout-observability-gaps` flags events with no insight coverage, not rate regressions. `signals-scout-general` sweeps cross-product surfaces but does not drill into individual custom event patterns.

**Noise escape hatch:** Set `emit: false` on `signals-scout-feedback-health`'s config in PostHog to put it in dry-run if it fires too often on low-volume days.

### `signals-scout-bounty-pipeline`

**Surface:** `bounty_completed` event in `src/app/api/open-collective/webhook/route.ts`. Fires on `expense.paid` events from Open Collective when a matched bounty expense is paid out. Properties: `bounty_id`, `bounty_title`, `amount`, `currency`.

**Discriminator:** No `bounty_completed` events for 30+ days while historical data shows prior completions — the Open Collective webhook URL is likely broken (rotated, secret changed, or returning silent errors).

**Why no built-in covers it:** No built-in scout watches custom server-side domain events from third-party webhooks. This surface is entirely specific to the Butwal-Hacks bounty program.

**Note:** The webhook has no signature verification (see code comment in `route.ts`). Adding `OC_WEBHOOK_SECRET` verification is recommended for production.

**Noise escape hatch:** Set `emit: false` on `signals-scout-bounty-pipeline`'s config in PostHog to silence it during expected quiet periods between hackathon cycles.

### Surfaces considered and ruled out

| Surface | Filter that ruled it out |
|---|---|
| Auth0 login/signup funnel | Not watchable — no explicit auth events captured (only `posthog.identify()` calls, which aren't named events) |
| Event/initiative engagement | Not watchable — no confirmed event names for browse/register flows in code scan |

---

## Follow-ups

- [ ] **Enable Session Replay** — go to PostHog → Project Settings → Session Replay and turn it on. No code changes needed (init doesn't block it).
- [ ] **Enable Error Tracking** — go to PostHog → Project Settings → Error Tracking and turn it on. No code changes needed.
- [ ] **Enable Support (Conversations)** — go to PostHog → Project Settings → Support and turn it on, then connect an inbound channel (email / inbox / Slack) so tickets reach the inbox.
- [ ] **Connect a Support inbound channel** — without a channel, the `conversations/ticket` source is enabled but dormant. Connect email, Zendesk inbox, or Slack in PostHog Support settings.
- [ ] **Add Open Collective webhook signature verification** — `src/app/api/open-collective/webhook/route.ts` has no `OC_WEBHOOK_SECRET` check. Add it to prevent unauthenticated payload injection.
- [ ] **Enable additional GitHub Issues tables** — only `issues` is syncing for `Butwal-Hacks/Site`. PRs, commits, and other tables can be enabled in PostHog → Data Management → Sources.
- [ ] **Enable feature-flags scout** — if you start using PostHog feature flags actively, enable `signals-scout-feature-flags` in PostHog → Self-driving → Scouts.
- [ ] **Enable data-warehouse scout** — if GitHub Issues sync health becomes a concern, enable `signals-scout-data-warehouse` to watch import reliability.
- [ ] **Enable web-vitals scout** — if you instrument Core Web Vitals (`$web_vitals`), enable `signals-scout-web-vitals`.

---

## What happens next

The scout coordinator picks up fresh configs within ~30 minutes of this run completing. Scouts will begin their first scans on the next coordinator tick. Findings cluster into reports in the Self-driving inbox — immediately-actionable ones can be turned into coding tasks directly from the report. Check your inbox at:

**https://eu.posthog.com/project/219907/inbox**
