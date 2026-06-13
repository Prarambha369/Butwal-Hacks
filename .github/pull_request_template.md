# 🚀 Pull Request

## 📝 Description
Briefly describe the changes introduced by this PR.

## 🎯 Goal
- [ ] Fixes a bug
- [ ] Adds a new feature
- [ ] Updates documentation
- [ ] Refactors existing code

## 🛠 Technical Changes
- List the main changes made to the codebase.
- Mention any new dependencies added.

## ✅ Verification Checklist
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Verified on Mobile (375px)
- [ ] Verified on Desktop
- [ ] No accessibility regressions (contrast, keyboard nav)
- [ ] Route has `generateMetadata` and JSON-LD (if applicable)

### Design System Compliance
- [ ] Cards use solid `bg-surface` with 1px `border-border` — no backdrop-blur
- [ ] Butwal Red (`#FE0000`) is the only accent — CTAs, trust markers, verified badges only
- [ ] Primary CTAs use pill shape (`rounded-full`)
- [ ] No inline `style={{}}` for colors — use Tailwind classes or CSS variables
- [ ] JetBrains Mono for badges, labels, metadata, and IDs

### Security
- [ ] API routes use rate limiting
- [ ] Mutation endpoints validate input via Zod schema
- [ ] Authenticated routes check the Auth0 session

## 📸 Screenshots / Loom
(Add visuals if this changes the UI)
