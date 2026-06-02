# 🚀 Butwal Hacks — Community Build Hub

[![License: MPL 2.0](https://img.shields.io/badge/License-MPL%202.0-blue.svg)](LICENSE)
[![Framework: Next.js 16](https://img.shields.io/badge/Framework-Next.js%2016-black)](https://nextjs.org/)
[![Backend: Supabase](https://img.shields.io/badge/Backend-Supabase-green)](https://supabase.com/)
[![Auth: Clerk](https://img.shields.io/badge/Auth-Clerk-blue)](https://clerk.com/)

**Butwal Hacks** is a decentralized technology education and innovation platform dedicated to empowering youth in Lumbini Province, Nepal. We transform regional potential into global impact by providing a structured hub for building, mentoring, and showcasing real-world technical solutions.

## 🌟 The Vision
Our goal is to move beyond "coding tutorials" and transition into "problem solving." By creating a localized ecosystem of hackers, we ensure that the tools built in Butwal are designed for the needs of Butwal.

---

## 🛠 Tech Stack

### Core Engine
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Components, Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Design System**: **Liquid Glass** (A custom, high-contrast, translucent aesthetic designed for impact)

### Infrastructure & Data
- **Backend-as-a-Service**: [Supabase](https://supabase.com/) (PostgreSQL, Realtime, Storage)
- **Authentication**: [Clerk](https://clerk.com/) (Enterprise-grade identity management)
- **Content Management**: Content-driven architecture (via `lib/content.ts`) for maximum performance and zero CMS overhead.
- **Deployment**: [Vercel](https://vercel.com/)

### Tooling & UX
- **Icons**: [Lucide React](https://lucide.dev/)
- **SEO/AEO**: Advanced JSON-LD structured data for AI-engine discoverability (ChatGPT, Perplexity, Gemini).
- **Animations**: Optimized CSS transitions and conditional `animejs` for high-performance reveals.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- A Supabase project
- A Clerk application

### Installation
1. **Clone the repo**
   ```bash
   git clone https://github.com/Prarambha369/Butwal-Hacks.git
   cd Butwal-Hacks
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in `my-app/` based on `.env.example`.

4. **Launch Development Server**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`.

---

## 📂 Project Structure

```text
.
├── docs/               # High-level specs, PRDs, and audit reports
├── my-app/             # The core Next.js application
│   ├── app/            # App Router (Pages, API routes, Layouts)
│   ├── components/     # Modular UI components
│   ├── lib/            # Business logic, content, and utility functions
│   └── public/         # Static assets
├── supabase/           # Database migrations and seed files
└── package.json        # Root workspace configuration
```

## 🤝 Contributing

We are a community-driven project. Whether you are a first-time contributor or a seasoned engineer, your help is welcome.

- **New to the project?** Read [CONTRIBUTING.md](CONTRIBUTING.md).
- **Want to help?** Check out the `good-first-issue` labels on GitHub.
- **Engineering standards**: We follow the **Ponytail (Lazy Senior Dev)** philosophy—minimal code, maximum efficiency.

## 📜 License
This project is licensed under the **Mozilla Public License 2.0**. See the [LICENSE](LICENSE) file for details.
