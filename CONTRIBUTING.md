# Contributing to Butwal Hacks

Thank you for your interest in building the future of technology education in Nepal! We welcome contributions from students, mentors, and engineers of all skill levels.

## 🛠 Our Philosophy: The "Ponytail" Approach
We follow the **Lazy Senior Developer** mindset. This means:
- **Avoid Over-Engineering**: Don't build a complex system if a simple one works.
- **Prefer Standard Libraries**: Use native platform features before adding dependencies.
- **Deletion > Addition**: The best code is the code that isn't written.
- **Boring is Better**: Prefer predictable, readable code over "clever" abstractions.

---

## 🚀 Getting Started

### 1. Environment Setup
Detailed setup instructions can be found in `docs/engineering/environment-setup.md`. Ensure you have:
- Node.js 20+
- A local instance of the project cloned and dependencies installed (`npm install`).

### 2. Development Workflow
We use a strict **Spec-Driven Development** process:
1. **Define the Spec**: Before coding, answer *What, Where, Why,* and *How to Test*.
2. **Small PRs**: One feature per Pull Request.
3. **Verification**: Every PR must pass the following checks from `my-app/`:
   ```bash
   npm run lint
   npm run build
   ```

### 3. Branching Strategy
Please use the following naming conventions:
- `feat/`: New features or enhancements (e.g., `feat/mentor-dashboard`)
- `fix/`: Bug fixes (e.g., `fix/mobile-menu-overlap`)
- `docs/`: Documentation changes (e.g., `docs/update-setup-guide`)
- `refactor/`: Code improvements without behavior changes (e.g., `refactor/auth-hooks`)

### 4. Commit Messages
We follow **Conventional Commits**:
- `feat: add X feature`
- `fix: resolve Y bug`
- `docs: update Z documentation`
- `chore: update dependencies`

---

## 📋 Contribution Checklist
Before submitting a Pull Request, ensure you have checked:
- [ ] **Accessibility**: Is the UI keyboard-navigable and contrast-compliant?
- [ ] **Mobile First**: Does it look great on a 375px viewport?
- [ ] **Performance**: Are images optimized? Is there unnecessary client-side JS?
- [ ] **SEO**: Does the new route have `generateMetadata` and a valid JSON-LD schema?
- [ ] **Tests**: If the logic is non-trivial, did you leave a runnable check behind?

## 🆘 Need Help?
If you're stuck, don't struggle in silence. Reach out via:
- **GitHub Issues**: Open an issue or comment on an existing one.
- **Discord/Community Channels**: Join the Butwal Hacks community.
- **Email**: `hello@butwalhacks.com`

## ⚖️ Code of Conduct
Be respectful, constructive, and inclusive. We are here to learn and build together for the community.
