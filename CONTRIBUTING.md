# Contributing to Butwal Hacks

## Setup

1. Fork the repository
2. Create a branch: `feat/your-feature-name`
3. Open a pull request to `main`

## Pre-commit Hooks

The project uses a pre-commit hook that runs ESLint on staged `.ts` and `.tsx` files. To activate it:

```bash
git config core.hooksPath .husky/
```

This points Git to read hooks from the committed `.husky/` directory. Without this step, the hook will not run. Run the command once after cloning.

## Code Style

- TypeScript strict mode. No `any` types.
- Conventional Commits (`feat:`, `fix:`, `chore:`).
- Default to server components. Add `"use client"` only for hooks, state, or browser APIs.

## UI Rules

All UI must use the Butwal Hacks design system:

- Use Tailwind arbitrary hex values (e.g., `bg-[#FE0000]`, `border-[#E5E5E5]`, `text-[#1F1F1F]`).
- Do not use standard Tailwind color classes (e.g., `bg-gray-800`, `text-red-500`).
- Do not use inline `style` attributes for colors.
- Cards use 1px borders. Surfaces are solid, no backdrop blur for decoration.
- Primary CTAs are pill-shaped (`rounded-full`) with red background (`#FE0000`).
- JetBrains Mono for IDs, dates, and code. DM Sans for everything else.

## Verification

```bash
cd my-app
npx tsc --noEmit       # TypeScript check
npm run lint            # ESLint
npm run test            # Vitest unit tests
npm run build           # Full Next.js production build
```

## Commits

Use Conventional Commits:

```
feat: add bento grid to homepage
fix: auth0 callback loop on logout
docs: update environment setup guide
chore: upgrade next.js to 16.2
```
