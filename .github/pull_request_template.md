# Pull Request

> What this change does, and the checks it has passed. Fill in every section; tick only what you actually ran.

## Description

What changed, and why.

## Goal

- [ ] Fixes a bug
- [ ] Adds a feature
- [ ] Updates documentation
- [ ] Refactors existing code

## Technical changes

- Main changes to the codebase.
- New dependencies, if any, with the reason they are needed.

## Verification

All four gates, run locally:

- [ ] `npx tsc --noEmit`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`

Manual checks, where applicable:

- [ ] Verified at 375px width
- [ ] Verified at desktop width
- [ ] No accessibility regressions: contrast, keyboard navigation, heading order
- [ ] Route has `generateMetadata` and JSON-LD, if it is a public page

If you could not run a gate locally, say which and why instead of ticking it.

## Design system

- [ ] Cards use a solid surface with a 1px border; no backdrop blur
- [ ] Red is used only on CTAs, trust markers, and verified badges
- [ ] Primary CTAs use the pill shape
- [ ] No inline `style={{}}` for colors; tokens and utility classes only
- [ ] JetBrains Mono for badges, labels, metadata, and IDs

See [DESIGN.md](../DESIGN.md).

## Security

- [ ] Every `POST`, `PUT`, `PATCH`, and `DELETE` route is wrapped in `withRateLimit()`
- [ ] Every input is validated with a Zod schema before any database access
- [ ] Every authenticated route checks the Auth0 session
- [ ] Every `createServiceClient()` call has an authorization check above it
- [ ] No secrets or credentials in the diff

## Screenshots

Add before-and-after visuals if this changes the UI.