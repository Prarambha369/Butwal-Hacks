---
target: landing page (page.tsx + sections)
total_score: 29
p0_count: 0
p1_count: 2
timestamp: 2026-07-15T17-18-11Z
slug: src-app-page-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Static landing page — no loading states to test, all content renders immediately |
| 2 | Match System / Real World | 3 | Good concrete language ("500+ active members", "Lumbini Province") but occasional generic phrasing |
| 3 | User Control and Freedom | 3 | Standard navigation, clear CTAs, no modal traps |
| 4 | Consistency and Standards | 3 | Mostly consistent — same card styles, button patterns, typography throughout. Minor drift in button radius (some 8px, some rounded-full) |
| 5 | Error Prevention | 4 | Static page, no forms or destructive actions to test |
| 6 | Recognition Rather Than Recall | 3 | Clear section labels, visible navigation. Icons on feature cards aid recognition |
| 7 | Flexibility and Efficiency | 1 | No keyboard shortcuts, no skip-nav. Standard navigation only |
| 8 | Aesthetic and Minimalist Design | 3 | Clean flat design. Some sections still carry eyebrow labels that add visual noise |
| 9 | Error Recovery | 4 | Static page, no error states to evaluate |
| 10 | Help and Documentation | 2 | No contextual help on the landing page. FAQ section is good but doesn't cover site navigation help |
| **Total** | | **29/40** | **Acceptable — Good** |

## Anti-Patterns Verdict

**AI slop assessment**: Low. The homepage has been iterated away from the typical AI template. The headline is specific to Lumbini/Butwal. The feature grid was restructured from 6 identical icon cards to a varied layout (5 + highlighted CTA). No `/features`, `/manifesto`, or other eyebrow labels remain on the primary sections. The copy reads specific and concrete rather than aspirational.

**Deterministic scan**: Clean. `detect.mjs --json` returned `[]` on all scanned files. No anti-patterns detected in the current code.

**Browser visualization**: Not available (Chrome not installed on this system). Manual review used instead.

## Overall Impression

The landing page is solid — clean, specific, and avoids the worst AI tells. The flat design system (white cards, 1px borders, selective red glow) is applied consistently. The copy improvements from Tier 2 make a real difference in specificity.

The biggest opportunity is the remaining eyebrow labels on 4 sections and the dead code in staggered-features.tsx. The page could also benefit from a more deliberate visual hierarchy — currently every section has the same weight (full-width, same padding, same border-bottom separator), which makes the page feel like a stack of equally-important blocks rather than a narrative journey.

## What's Working

1. **Concrete copy** — The Hero now says "500+ active members" instead of "vibrant community," and "Free hackathons, mentorship, and project-based learning" instead of "innovation opportunities." The FAQ answers are specific and detailed.

2. **Grid variety** — The staggered-features section no longer has 6 identical icon cards. The 5-card + full-width CTA pattern breaks the template grid. The auto-rows layout with varied card heights creates natural rhythm.

3. **Consistent design language** — Cards use the same 1px border, 12px radius patterns. Butwal Red appears only on CTAs and verified badges — never decoratively. The JetBrains Mono badges and labels create a technical, precise feel.

## Priority Issues

### [P1] Dead code in staggered-features.tsx

- **What**: Each feature object has `isWide: false` and `useHighlight: false` properties that are never read.
- **Why it matters**: Dead code accumulates and confuses future developers. Someone maintaining this component will wonder what these fields do.
- **Fix**: Remove the two unused fields from all 5 feature objects.
- **Suggested command**: `distill staggered-features.tsx`

### [P1] Remaining eyebrow labels on 4 sections

- **What**: `database-table.tsx` (`/projects`), `impact-metrics.tsx` (`IMPACT ACROSS NEPAL`), `featured-projects.tsx` (`SHOWCASE`), `non-profit-faq.tsx` (`COMMON QUESTIONS`) still use the `font-mono text-[10px] font-semibold uppercase tracking-[0.15em]` pattern.
- **Why it matters**: Even when the content is specific, the uniform pattern across 4+ sections is the hallmark of AI-generated scaffolding. It signals "I put a label above every section because templates do that" rather than intentional design.
- **Fix**: Convert to inline pill badges, merge into the heading as a subtitle, or remove entirely for the less-contentful ones.
- **Suggested command**: `quieter <section>` or `polish homepage-sections`

### [P2] Section rhythm is uniform

- **What**: Every section is full-width with the same padding (py-20 md:py-28), the same border-bottom separator, and roughly the same visual weight.
- **Why it matters**: A page where every block is the same size creates no narrative arc. Users can't tell which section is the main pitch vs. supporting evidence.
- **Fix**: Vary section spacing — make the Hero and CTA feel larger, tighten the Trusted By and FAQ sections. Use background color alternation (not just borders) to create rhythm.
- **Suggested command**: `layout homepage-sections`

### [P2] ContactCTA uses rounded-lg (8px) instead of pill-shaped button

- **What**: The primary CTA in `ContactCTA.tsx` uses `rounded-lg` (8px) while the Hero uses `bh-btn-pill` with `rounded-full`.
- **Why it matters**: Inconsistent button radius on primary CTAs undermines the "one component vocabulary" principle from the design system.
- **Fix**: Use `rounded-full` and `bh-btn-pill` pattern on the ContactCTA primary button.
- **Suggested command**: `polish ContactCTA.tsx`

### [P3] TypographyBlocks end matter

- **What**: The bottom anchor in `typography-blocks.tsx` shows "N blocks · X min read" which is a blog convention on a landing page section.
- **Why it matters**: Minor — it's a nod to the Notion-style presentation, but it adds unnecessary meta-commentary.
- **Fix**: Remove the block count / read time line.
- **Suggested command**: `distill typography-blocks.tsx`

## Persona Red Flags

**Alex (Power User)**:
- No skip-to-content link. Tab order starts at the navbar, which means 16 tab stops before the first content section.
- No keyboard shortcut hints anywhere on the page.

**Jordan (First-Timer)**:
- The flow is clear: Hero → Trusted By → Stats → Features → Projects → FAQ → CTA. This is a good narrative structure.
- "🌱 New to Butwal Hacks?" CTA card is well-placed — it catches users who need orientation.
- Potential confusion: The Hero says "Lumbini's Youth Tech Hub" which is a specific geographic claim. A first-time visitor from Kathmandu might wonder "is this for me?"

**Riley (Stress Tester)**:
- Empty states: Not applicable — the page always has content (hardcoded projects, static FAQs).
- Edge cases: The code block in TypographyBlocks has a "Copy" button but no copy-to-clipboard functionality implemented. Clicking it does nothing.
- The featured projects section expects data from props; if `projects` is empty, it renders nothing (the `if (projects.length === 0) return null` check is clean).

## Minor Observations

- `trusted-by.tsx` uses `dangerouslySetInnerHTML` for SVG content — this is acceptable for static path data but worth noting for security.
- The `database-table.tsx` is a static mockup — the "Filter" and "Sort" buttons are non-functional. Consider adding `aria-disabled` or labeling them as mockups.
- `TypographyBlocks` "Copy" code button has no clipboard functionality — just a decorative UI element.

## Questions to Consider

1. "Does every section need to be full-width with a border-bottom separator, or could alternating backgrounds create more visual rhythm?"
2. "Is the landing page for first-time visitors who don't know Butwal Hacks, or for returning users? The current content serves both, but the Hero could be sharper for one audience."
3. "What would a version of this page that loads in under 1 second on a mid-range phone in Nepal look like?"
