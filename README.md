<div align="center">
  <br/>
  <img src="https://butwalhacks.com/Logo_Circular.svg" alt="Butwal Hacks" width="120" height="120"/>
  <br/>
  <h1>🚀 Butwal Hacks</h1>
  <p><strong>Powering Nepal's Next Generation of Builders</strong></p>
  <p>An ORCID-style verification system and hackathon management platform</p>

  <p>
    <a href="LICENSE">
      <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"/>
    </a>
    <a href="https://nextjs.org/">
      <img src="https://img.shields.io/badge/Framework-Next.js%2016-black" alt="Next.js 16"/>
    </a>
    <a href="https://supabase.com/">
      <img src="https://img.shields.io/badge/Database-Supabase-green" alt="Supabase"/>
    </a>
    <a href="https://auth0.com/">
      <img src="https://img.shields.io/badge/Auth-Auth0-orange" alt="Auth0"/>
    </a>
    <a href="https://tailwindcss.com/">
      <img src="https://img.shields.io/badge/Style-Tailwind%20v4-38bdf8" alt="Tailwind v4"/>
    </a>
    <a href="https://github.com/Prarambha369/Butwal-Hacks/issues">
      <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen" alt="PRs Welcome"/>
    </a>
  </p>
</div>

---

## 🌟 The Vision

**Butwal Hacks** is a decentralized technology education and innovation platform dedicated to empowering youth in Lumbini Province, Nepal. We transform regional potential into global impact by providing a structured hub for building, mentoring, and showcasing real-world technical solutions.

This isn't another coding tutorial site. This is a **high-end hacker workshop** — where builders earn cryptographically-verified credentials, collaborate on real projects, and get discovered by sponsors and employers.

---

## 🎨 Design Principles

Surfaces are grounded. Color is earned. Every pixel has a job.

| Trust Level | Visual | Meaning |
|-------------|--------|---------|
| **🔴 Verified** | Red border + subtle red glow | Issued and cryptographically signed by a verified organizer. |
| **⚪ Self-Reported** | Standard border, no glow | User-claimed. Pending verification. |
| **⚪ Revoked** | Greyed out, strikethrough | Previously issued marker that has been revoked. |

The platform blends clean, solid surfaces with selective red accents. Flat cards with crisp 1px borders (`border-[#E5E5E5]`) keep the interface readable and honest. A subtle `backdrop-filter` blur appears where it serves a purpose — overlays, toasts, image captions — not as a blanket decoration. The red glow (`--bh-glow-red`) is reserved for primary CTAs and verified trust markers. It's a signal, not a style.

See [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) for the full language reference.

---

## 🏗️ Core Features

### 🪪 ORCID Hacker IDs
Every hacker gets a unique, permanent `BH-24-XXXX` identifier. Public profiles at `/p/[slug_id]` serve as a verifiable, portable credential.

### ⭐ Cryptographic Trust Markers
Organizers issue verifiable markers for specific achievements. Each marker is signed with an Ed25519 keypair, making it tamper-proof and independently verifiable at `/verify/[marker_id]`.

### 🎯 Devpost-Style Project Expo
Hackers submit projects with GitHub repos, demo URLs, and team members. The project grid at `/projects` showcases all work publicly.

### 👥 MLH-Style Team Formation
Hackers form teams for events, with captain roles and member management. Teams can collaborate on shared project submissions.

### 🏢 Multi-Chapter Support
Auth0 Organizations power chapters (Butwal, Pokhara, etc.), each with their own events, members, and dashboard.

### 🏆 Sponsor & Recruiter Portal
Verified sponsors can search for talent by skill, browse the bounty board, and discover rising builders.

### 📊 Transparent Finance via Open Collective
All sponsorships and bounties flow through Open Collective. Every transaction is visible on the `/transparency` page.

---

## 🧱 Tech Stack

```
Browser ──► Vercel (Next.js 16) ──┬── Auth0 (Authentication)
                                   ├── Supabase (PostgreSQL Database)
                                   ├── Cloudinary (Image CDN)
                                   ├── Upstash Redis (Rate Limiting)
                                   ├── Resend (Transactional Email)
                                   ├── Cloudflare R2 (Video Storage)
                                   └── Open Collective (Payments)
```

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server Components) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Authentication** | [Auth0](https://auth0.com/) (Regular Web App, Post-Login Action syncs to Supabase) |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL, Realtime — no Supabase Auth) |
| **Image CDN** | [Cloudinary](https://cloudinary.com/) |
| **Rate Limiting** | [Upstash Redis](https://upstash.com/) |
| **Email** | [Resend](https://resend.com/) |
| **Analytics** | [PostHog](https://posthog.com/) + [Vercel Analytics](https://vercel.com/analytics) |
| **Payments** | [Open Collective](https://opencollective.com/butwal-hacks) |
| **AI** | [Groq](https://groq.com/) (team matching, chatbot, pitch generation, OCR) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/Prarambha369/Butwal-Hacks.git
cd Butwal-Hacks

# Install dependencies (lockfile at root)
npm install

# Set up environment
cp .env.example my-app/.env.local
# Edit my-app/.env.local with your API keys

# Start development
npm run dev
# → http://localhost:3000
```

### Verification

```bash
cd my-app
npx tsc --noEmit   # TypeScript typecheck
npm run lint        # ESLint
npm run test        # Unit tests
npm run build       # Production build
```

---

## 📁 Project Structure

```
.
├── my-app/                 # Next.js application
│   ├── src/
│   │   ├── app/            # App Router pages & API routes (35+ endpoints)
│   │   ├── components/     # React components (UI, dashboard, hacker-id)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Business logic, content, utilities
│   │   └── utils/          # Supabase client factories
│   ├── public/             # Static assets
│   └── .env.example        # Environment template
├── supabase/
│   └── migrations/         # 82 database migrations
├── docs/                   # Architecture, setup, threat model
├── .github/                # CI workflows, issue templates, PR template
├── .env.example            # All environment variables
├── package.json            # Root workspace config
└── vercel.json             # Deployment config
```

---

## 🤝 Contributing

We are a community-driven project. Whether you are a first-time contributor or a seasoned engineer, your help is welcome.

- **New to the project?** Read [CONTRIBUTING.md](CONTRIBUTING.md).
- **Found a bug?** [Open a Bug Report](https://github.com/Prarambha369/Butwal-Hacks/issues/new?template=bug_report.yml).
- **Have an idea?** [Submit a Feature Request](https://github.com/Prarambha369/Butwal-Hacks/issues/new?template=feature_request.yml).
- **Wiki documentation**: See [`docs/`](./docs) for architecture, design system, deployment, and API reference.
- **Engineering standards**: We follow the **Ponytail (Lazy Senior Dev)** philosophy — minimal code, maximum efficiency.

### Commit Style

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add bento grid to homepage
fix: auth0 callback loop on logout
docs: update environment setup guide
chore: upgrade next.js to 16.2
```

---

## 🔒 Security

Butwal Hacks uses a 3-layer security architecture:

1. **Supabase Service Role Key** — Never exposed to the browser. All writes go through server-side API routes.
2. **Auth0 Session Validation** — Every mutation endpoint verifies the user's session before processing.
3. **Zod Input Validation** — All input is parsed, sanitized, and validated before reaching the database.

See [SECURITY.md](SECURITY.md) for our vulnerability disclosure process.

---

## 📜 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built with ❤️ by the Butwal Hacks community in Lumbini Province, Nepal</sub>
</div>
