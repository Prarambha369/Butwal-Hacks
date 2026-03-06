# Contributing to Butwal Hacks

Thank you for helping build Butwal Hacks.
This guide is for volunteers, students, mentors, and maintainers contributing to the website.

## Who This Is For

- Student contributors making first OSS contributions
- Design and content volunteers improving pages and messaging
- Technical mentors reviewing architecture, UX, SEO, and accessibility

## Project Stack (Do Not Change Without Maintainer Approval)

- Next.js App Router + TypeScript
- Tailwind CSS + shadcn-style primitives
- Lucide icons
- Existing metadata + JSON-LD SEO approach

## Local Setup

```bash
cd my-app
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production Readiness Check (Required Before PR)

Run from `my-app/`:

```bash
npm run lint
npm run build
```

A PR is only ready for review when both commands pass.

## Branch Naming

Use one of these patterns:

- `feat/<short-feature-name>`
- `fix/<short-bug-name>`
- `docs/<short-doc-change>`
- `refactor/<short-scope>`

Examples:

- `feat/support-page-cta-improvements`
- `fix/mobile-nav-focus-ring`
- `docs/update-volunteer-playbook`

## Commit Message Style

Use conventional prefixes:

- `feat:` new feature or enhancement
- `fix:` bug fix
- `docs:` documentation only
- `refactor:` no behavior change
- `chore:` maintenance change

Examples:

- `feat: add governance metrics block`
- `fix: escape apostrophes causing lint failures`
- `docs: add feature-wise repository map`

## Suggested Issue Labels

Use these labels for triage and volunteer matching:

- `good-first-issue`
- `help-wanted`
- `frontend`
- `content`
- `seo`
- `accessibility`
- `performance`
- `documentation`
- `priority:high`
- `priority:medium`
- `priority:low`

## Stepwise Workstreams (Phase-Aligned)

### 1. Research and Strategy

- Audience clarity: students, mentors, sponsors
- Benchmark high-quality nonprofit tech websites
- Improve hero messaging and CTA clarity
- Define keyword clusters and sitemap priorities

### 2. Architecture and Structure

- Keep App Router clean and modular
- Prefer reusable components over page-specific duplication
- Server Components by default unless client state is required
- Keep feature concerns separated (`app`, `components`, `lib`)

### 3. UX and Conversion

- Keep flow clear: Hero -> Value -> Programs -> Proof -> Governance -> CTA
- Maintain one H1 per page
- Use short paragraphs and scannable headings
- Ensure key actions are obvious: join, apply, contribute

### 4. Animation and Interaction

- Keep motion subtle and meaningful
- Avoid animation that blocks rendering or causes layout shifts
- Ensure keyboard and reduced-motion safe behavior

### 5. SEO and Performance

- Add route-level metadata with canonical paths
- Keep structured data valid and relevant
- Optimize images and avoid unnecessary client JS
- Preserve fast load on mobile networks

### 6. Validation and Maintainability

- Use semantic HTML and accessible components
- Keep naming predictable for new volunteers
- Add concise comments only where logic is non-obvious

### 7. Deployment and Monitoring

- Verify route indexability through sitemap/robots
- Keep analytics events meaningful and privacy-aware
- Track CTA clicks and page engagement patterns

## Pull Request Checklist

- [ ] Scope is focused and easy to review
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] No accessibility regression (keyboard/focus/contrast)
- [ ] Mobile and desktop layout both verified
- [ ] Copy updates match nonprofit institutional tone
- [ ] Screenshots included for visible UI changes

## Review Expectations

Maintainers prioritize:

- correctness and stability,
- accessibility and semantic quality,
- clear UX flow,
- readability for future volunteers.

## Code of Collaboration

- Be respectful and constructive in comments
- Explain decisions briefly in PR descriptions
- Ask for help early if blocked

## Need Help?

- Website: `https://butwalhacks.com`
- Contact: `hello@butwalhacks.com`
