---
target: my-app/src/app/(main)/dashboard
total_score: 29
p0_count: 0
p1_count: 0
p2_count: 3
p3_count: 1
timestamp: 2026-07-13T10-02-42Z
slug: my-app-src-app-main-dashboard
---
## Design Critique: Butwal Hacks Dashboard (Re-run)

**Target:** `my-app/src/app/(main)/dashboard/`
**Method:** Dual-agent (A: code-reviewer-deepseek-flash · B: detect.mjs CLI)

### Anti-Patterns Verdict

The dashboard anti-patterns have been largely resolved:
- **Spring easing (4 files):** ✅ REMOVED — `duration-150 ease-out` replaced `cubic-bezier(0.175,0.885,0.32,1.275)`
- **animate-bounce:** ✅ REMOVED — replaced with `animate-pulse` in certificate-scanner.tsx
- **Legacy classes (lg-surface, border-glass):** ✅ REMOVED — `bh-card` replaces across 13 dashboard files
- **Card radius inconsistency:** ✅ REMOVED — `rounded-3xl` (24px) standardized to `rounded-xl` (12px from bh-card)
- **Decorative blur-3xl:** ✅ REMOVED — leaderboard podium no longer has decorative blur

**Detector Scan:** 0 issues found (exit code 0) — completely clean.

### Design Health Score: 29/40 (+2 from previous 27/40)

| # | Heuristic | Previous | Current | Change |
|---|-----------|:--------:|:-------:|:------:|
| 1 | Visibility of System Status | 3 | 3 | — |
| 2 | Match System / Real World | 3 | 3 | — |
| 3 | User Control and Freedom | 3 | 3 | — |
| 4 | Consistency and Standards | 3 | **4** | ✅ +1 |
| 5 | Error Prevention | 3 | 3 | — |
| 6 | Recognition Rather Than Recall | 3 | 3 | — |
| 7 | Flexibility and Efficiency | 2 | 2 | — |
| 8 | Aesthetic and Minimalist Design | 3 | **4** | ✅ +1 |
| 9 | Error Recovery | 2 | 2 | — |
| 10 | Help and Documentation | 2 | 2 | — |
| **Total** | | **27/40** | **29/40** | **+2** |

### What Improved
- **Consistency:** Cards now uniformly use `bh-card` with `rounded-xl`. No more mixed radius between hacker/organizer/maintainer panels.
- **Aesthetic:** Decorative `blur-3xl` gone. Spring easing removed. Legacy class aliases cleaned up. Less visual noise.

### Remaining Priority Issues
- **P2:** Section eyebrow pattern overused on every heading
- **P2:** Server actions still throw Errors (no structured recovery)
- **P2:** No keyboard shortcuts or power user features
- **P3:** ~100+ files outside dashboard still use legacy classes

### Overall
Score improved from "Acceptable" (27) toward "Good" (29). The visual consistency fixes moved the needle. Remaining work is structural (keyboard shortcuts, error handling) — not visual polish.
