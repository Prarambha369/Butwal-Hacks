# Description

Please include a summary of the changes and the motivation behind them.

Fixes #(issue)

## Type of Change

- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would break existing functionality)
- [ ] 📚 Documentation update
- [ ] 🔧 Refactor / Chore (no functional changes)

## How Has This Been Tested?

- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` produces no new errors
- [ ] `npm run test` passes
- [ ] `npm run build` succeeds
- [ ] Tested locally on `localhost:3000`

## Design System Checklist

### Flat Surfaces + Selective Red Glow
- [ ] Cards use solid `bg-surface` with 1px `border-border` — no backdrop-blur
- [ ] Butwal Red (`#FE0000`) is the only accent — used for CTAs, trust markers, and verified badges only
- [ ] Primary CTAs use pill shape (`rounded-full`) with red glow on hover
- [ ] No inline `style={{}}` for colors — use `var(--bh-*)` or Tailwind classes (`bg-surface`, `text-primary`, `border-border`)
- [ ] JetBrains Mono (`font-mono`) used for badges, labels, metadata, and IDs

### Code Quality
- [ ] I have performed a self-review of my code
- [ ] My changes generate no new warnings or console errors
- [ ] I have added comments where the logic is non-obvious
- [ ] I have updated documentation where relevant

### Security
- [ ] API routes use `withRateLimit()` or `checkRateLimit()`
- [ ] Mutation endpoints validate input via Zod schema
- [ ] Authenticated routes check the Auth0 session

### Accessibility
- [ ] All images have `alt` text
- [ ] Interactive elements have `aria-label` where needed
- [ ] The UI works at 375px viewport width

## Screenshots (if applicable)

| Before | After |
|--------|-------|
|        |       |
