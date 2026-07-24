---
target: hacker dashboard overview + sub-pages
total_score: 25
p0_count: 0
p1_count: 3
p2_count: 2
p3_count: 1
timestamp: 2026-07-16T19-30-51Z
slug: src-app-main-dashboard-hacker-page-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | Progress bars at 0% for unstarted milestones ambiguous |
| 2 | Match System / Real World | 3/4 | Clean dev language, familiar concepts |
| 3 | User Control and Freedom | 3/4 | Wizard dismissible via Esc; no undo visible |
| 4 | Consistency and Standards | 3/4 | 3 section heading variants on one page adds noise |
| 5 | Error Prevention | 2/4 | Limited guardrails on overview; forms need review |
| 6 | Recognition Rather Than Recall | 3/4 | Sidebar always visible; clear section labels |
| 7 | Flexibility and Efficiency | 1/4 | No keyboard shortcuts, command palette, or bulk actions |
| 8 | Aesthetic and Minimalist Design | 3/4 | Clean layouts; milestone 0% bars create negative space |
| 9 | Error Recovery | 2/4 | Activity feed handles errors well; server comps lack boundaries |
| 10 | Help and Documentation | 2/4 | First-run wizard good; no contextual help in dashboard |
| **Total** | | **25/40** | **Acceptable** |

## Anti-Patterns Verdict

**LLM assessment**: The dashboard avoids most AI slop tells. It uses solid flat surfaces, crisp borders, and a single red accent — no glass, no gradients, no numbered section markers. The layout follows established dashboard conventions (sidebar + stat cards + activity feed). The first-run wizard is well-built with proper accessibility and reduced motion support.

**Deterministic scan**: 3 findings — all `design-system-font-size` violations using `text-[9px]` and `text-[11px]` outside the DESIGN.md type ramp. These are in `api-keys/page.tsx` (status badge text) and `empty-state.tsx` (hint text). Advisory severity.

**Visual overlays**: Not available (Chrome not installed).

## Overall Impression

Solid and usable with a consistent design language. Architecture is clean — server components for data fetching, client components for interactivity. Main opportunity: make the dashboard feel more responsive to individual progress. The milestone section punishes empty states, and power users have no efficiency tools.

## What's Working

1. **First-run wizard**: Excellent — progressive disclosure, step tracking, reduced motion, celebrate-on-complete flow, Escape key dismiss. Production-grade UX.
2. **Consistent component vocabulary**: bh-card, section-heading, empty-state, skeleton — applied consistently across pages.
3. **Clean information hierarchy**: Stats → Chapters → Activity + Milestones — guides attention from most to least critical.

## Priority Issues

### [P1] No keyboard navigation or power-user shortcuts
Sidebar is the only navigation. No Cmd+K palette, no keyboard shortcuts for common actions. Every nav action requires mousing to the sidebar. Fix with a command palette.
→ `/impeccable craft command-palette`

### [P1] Inconsistent loading states
Overview page is server component (SSR, no loading state). API keys page uses full-page spinner. Other pages use FeedSkeleton/CardSkeleton. Standardize on skeletons.
→ `/impeccable polish src/app/(main)/dashboard/hacker/api-keys`

### [P1] No contextual help within dashboard
Once first-run wizard is dismissed, no help icon, no FAQ link, no tooltips on "Trust Markers" or XP. New hackers hitting unfamiliar terms have no way to learn.
→ `/impeccable clarify src/app/(main)/dashboard/hacker`

### [P2] Milestone 0% bars are demotivating
"First Ship" and "Team Lead" show 0/1 progress bars. A 0% filled bar looks like failure, not "not started." Better: hide bar at 0% and show "Get started" state.
→ `/impeccable polish src/components/dashboard`

### [P2] Three section heading variants on one page
"Your Chapters" uses `accent`, "Recent Activity" uses `icon`, "Next Up" uses `badge` — three different styles in one viewport. Pick one.
→ `/impeccable polish src/app/(main)/dashboard/hacker/page.tsx`

### [P3] 9px font on status badges
Detector found `text-[9px]` and `text-[11px]` outside the type ramp in api-keys page and empty-state component.
→ `/impeccable typeset`

## Persona Red Flags

**Alex (Power User)**: No keyboard shortcuts — 8 sidebar clicks × 20 workdays to navigate between pages. No bulk operations on API keys. Annoying spinner on keys page.

**Jordan (First-Timer)**: "Trust Markers" with no explanation. "Level 1 | Novice" — what does Novice mean? No help link. Milestones at 0% look broken.

**Sam (Accessibility)**: 9px status badges too small (WCAG recommends 12px min). Spinner doesn't communicate structure to screen readers.

## Questions to Consider
- What if milestones showed "Opportunities" with "Start" buttons instead of 0% bars?
- Does the sidebar need 8 links for 2-3 primary tasks per user? Could secondary links group under a "More" menu?
- What would a personalized "next action" card look like instead of three empty progress bars?
