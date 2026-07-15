# Product

## Register

product

[//]: # (app.butwalhacks.com uses the product register; butwalhacks.com marketing surface uses the brand register)

## Platform

web

## Users

**Hackers** — the primary audience. Students and young builders across Nepal who participate in hackathons, build projects, and earn verifiable credentials. They come to discover events, form teams, ship projects, and build a portable, cryptographically-signed hacker identity.

**Organizers** — event runners who manage hackathons, review projects, issue trust markers, and coordinate teams. Anyone with a maintainer permit can organize.

**Maintainers** — platform administrators with audit and override powers over the verification system, trust markers, and user roles.

**Sponsors** — companies and organizations, invited by organizers, who post bounties, recruit from the talent pool, and provide prizes and opportunities.

## Product Purpose

Butwal Hacks is an ORCID-style verification system and hackathon management platform for Nepal's youth tech community. It gives every young builder a portable, cryptographically-verified digital identity — a hacker passport they carry across every event, team, and project they touch.

The platform manages the full lifecycle: event discovery → team formation → project submission → credentialing → transparent community funding. Each stage feeds the next; a hacker who joins an event can form a team, ship a project, earn a trust marker, and build a verified portfolio that outlasts any single platform.

Success means a generation of Nepali builders has an irrefutable, shareable record of their work — and the tools they need to create it. Measured by: trust markers issued, projects submitted, and the number of hackers who return after their first 48 hours.

## Positioning

Three claims, each true, each describing a different facet of the same product:

- **Nepal's first ORCID-style trust verification for hackers** — cryptographically-signed credentials that outlast any single event or platform. Driven by the Ed25519 signing system at `/api/verify` and the trust marker lifecycle (issue → verify → revoke).
- **The all-in-one hackathon platform for Nepal's tech community** — events, teams, projects, verification, and funding in one coherent system. Driven by the event engine, team management, project gallery, and Open Collective integration.
- **Your verified hacker passport for Nepal's tech ecosystem** — a portable identity that proves what you built, where, and when, signed at the protocol level. Driven by the public profile at `/p/[slug_id]`, the API key system, and the embeddable verification widget.

Every screen reinforces at least one claim. The product register (dashboard/app) leads with **tooling**: helping hackers get things done efficiently. The brand register (landing page) leads with **vision**: why a portable identity matters for Nepal's tech future.

## Brand Personality

**Authoritative, Clean, Ambitious.**

Voice is confident and direct — the red Liquid Glass system conveys trust earned through rigor, not friendliness through warmth. The platform talks to builders as peers who respect precision.

Tone adapts to context:
- **Onboarding:** instructional and clear. The FirstRunWizard walks new users through profile → chapter → project → trust marker without assuming prior platform knowledge.
- **Task flow:** concise and efficient. Error messages are specific ("Profile not found — finish onboarding first"), not generic. Success feedback is immediate (toast, not modal).
- **Achievement:** celebratory and proud. Trust marker unlocks, level-ups, and project milestones get visual emphasis with the red glow system.
- **Error states:** direct and helpful. Rate limits explain why ("You're sending messages too quickly"), not just "too many requests." Empty states teach the interface instead of saying "nothing here."

Emotional goals: a hacker should feel **trusted** (the verification system has their back), **capable** (the tools make complex tasks manageable), and **part of something larger** (their work sits alongside peers in a growing national ecosystem).

## Anti-references

Butwal Hacks should explicitly NOT look like:

- **Devpost / Dribbble-heavy patterns** — over-decorated buttons, mismatched forms, gradient-heavy cards, gratuitous motion, display fonts where labels belong, and invented affordances for standard tasks. The failure mode here is strangeness without purpose.

Instead, aim for the **earned familiarity** of tools like **Stripe, Linear, and Figma** — interfaces where the tool disappears into the task. Consistent component vocabulary, restrained color, no ornament, exacting spacing. Every screen feels like it was built by the same team on the same day.

Additional anti-references:
- Traditional Nepali government or university institutional portals
- The "SaaS cliché" hero-metric template with big numbers, small labels, and gradient accents
- Glassmorphism used decoratively rather than purposefully (the Liquid Glass system is structural, not decorative)

## Design Principles

1. **The tool disappears into the task.** Users come to build, verify, and connect — not to admire the UI. Every animation, color, and component must serve the workflow. An empty state that teaches is better than a card grid that dazzles. A toast that says exactly what went wrong is better than an animation that looks nice.

2. **Trust is earned through rigor.** The red-on-dark visual system communicates authority and precision. Trust markers glow when active, go dim when revoked — the visual system mirrors the cryptographic truth underneath. Every screen must earn the user's trust through clarity, not convince through polish.

3. **Consistency is a virtue.** One button shape. One form control vocabulary. One icon style. One spacing scale (4px base). One motion language (150–250ms, ease-out, no bounce). A component that looks like another component must behave like it. The EmptyState component, the GlassPrimitive, and the FirstRunWizard are all part of the same visual vocabulary.

4. **Security is not optional.** Every API mutation is rate-limited. Every input is validated against a strict Zod schema. Every user's data is gated by role. The UI reflects this: clear error states, explicit permission boundaries, and honest loading indicators. No inline secrets, no unvalidated redirects, no information leakage through debug logs.

5. **Ship for Nepal first.** The platform serves an audience where device type, bandwidth, and familiarity with SaaS conventions vary widely. Load fast on mid-range devices. Work without animations. Localize to Nepali. Teach the interface through onboarding (FirstRunWizard) and empty states (EmptyState component). Never assume "everyone knows how this works."

## Accessibility & Inclusion

Target: **WCAG 2.1 AA+** with automated and manual testing targets.

### Motion
- Every animation is wrapped in a `@media (prefers-reduced-motion: reduce)` check. Components self-detect via `window.matchMedia` with a live listener, not a one-time check.
- No animation is essential to understanding the interface. The platform works fully without any motion.
- Entrance animations are opacity-based, never layout-animated. No translateX, no scale transitions on critical content.
- Hover effects (`hover:scale-[1.02]`, `hover:border-bh-red-500/50`) are interaction feedback, not entrance animations, and are safe to leave active.

### Contrast & Color
- Body text (#d6d6d6) against base background (#242424): 8.6:1 — well above 4.5:1 minimum.
- Muted text (#898989) against base background: 4.7:1 — meets 4.5:1 for body text.
- Red (#FE0000) never carries information alone. Always paired with an icon, label, structural position, or text. Color-blind safe by design.
- Focus states use `ring-2 ring-bh-red-500/50` with visible outlines, not just color changes.

### Keyboard & Screen Reader
- Full keyboard navigation across every surface. Dropdowns, modals, and search use native dialog semantics (`role="dialog"`, `aria-modal="true"`).
- Screen-reader tested flows: sign-up, profile creation, project submission, team management.
- All interactive elements have `aria-label` or visible text labels. Icon-only buttons (toggle, close, edit) use `aria-label`.
- Toast notifications use `role="status"` or `role="alert"` as appropriate.

### Language
- All user-facing strings are localized via `@/lib/i18n` in English and Nepali.
- The locale context (`language-provider.tsx`) wraps the entire app, with locale persisted to localStorage.
- Number formatting, dates, and times respect the selected locale.

### Testing targets
- Automated: axe-core in CI for every PR.
- Manual: screen-reader walkthrough of the full hacker flow (sign-up → profile → project → trust marker) before every release.
- Reduced motion: verify all entrance animations are suppressed with `@media (prefers-reduced-motion: reduce)` enabled at the OS level.
