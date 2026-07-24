# Butwal Hacks

A credential verification system and hackathon management platform. Built for student tech communities in Nepal.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Authentication:** Auth0 (Regular Web App, Post-Login Action syncs to Supabase)
- **Database:** Supabase (PostgreSQL, accessed via Service Role Key, no Supabase Auth)
- **Image CDN:** Cloudinary
- **Rate Limiting:** Upstash Redis
- **Email:** Resend
- **Analytics:** PostHog + Vercel Analytics
- **Payments:** Open Collective
- **AI:** Groq (team matching, chatbot, OCR)
- **Deployment:** Vercel

## Architecture

Auth0 handles identity. Supabase stores relational data via the Service Role Key (bypasses RLS, server-side only). Cloudinary handles media uploads with pre-signed signatures. All mutation API routes use Zod validation, Auth0 session checks, and Upstash rate limiting.

## Quick Start

```bash
git clone https://github.com/Prarambha369/Butwal-Hacks.git
cd Butwal-Hacks
npm install
cp .env.example my-app/.env.local
# Edit my-app/.env.local with your API keys
npm run dev
```

### Verification

```bash
cd my-app
npx tsc --noEmit
npm run lint
npm run test
npm run build
```

## Project Structure

```
.
├── my-app/                 # Next.js application
│   ├── src/
│   │   ├── app/            # App Router pages and API routes (85 pages, 44 API route handlers)
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Business logic, content, utilities
│   │   └── utils/          # Supabase client factories
│   ├── public/             # Static assets
│   └── .env.example        # Environment template
├── supabase/
│   └── migrations/         # 82 database migrations
├── docs/                   # Architecture, design system, threat model
├── .github/                # CI workflows, issue templates, PR template
└── vercel.json             # Deployment config
```

## License

MIT
