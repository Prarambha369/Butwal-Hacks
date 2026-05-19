# Butwal Hacks - Next.js Website

This is the Next.js application for [Butwal Hacks](https://butwalhacks.com), a student-led community empowering builders, creators, and innovators in Western Nepal.

## 🚀 Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, pnpm, or bun

### Development

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm devcd /workspaces/Butwal-Hacks-
cp logo.jpg logo.png
cp logo.png my-app/public/logo.pngcd my-app
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Setting Up the Logo

Copy the logo file to the public directory:

```bash
cp ../logo.jpg public/logo.png
```

## 📁 Project Structure

```
my-app/
├── app/
│   ├── layout.tsx      # Root layout with fonts and metadata
│   ├── page.tsx        # Home page
│   └── globals.css     # Global styles with Tailwind
├── components/
│   ├── hero.tsx        # Hero section with logo
│   ├── mission.tsx     # Mission pillars section
│   ├── events-grid.tsx # Events showcase
│   ├── trusted-by.tsx  # Partners/sponsors section
│   └── footer.tsx      # Site footer
├── lib/
│   └── utils.ts        # Utility functions (cn helper)
└── public/
    └── logo.png        # Butwal Hacks logo
```

## 🛠️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Language:** TypeScript

## 📝 Editing Content

### Events

Edit the events in [components/events-grid.tsx](components/events-grid.tsx):

```tsx
const events: Event[] = [
  {
    id: "hackday",
    title: "HackDay",
    date: "January 17, 2026",
    status: "upcoming",
    description: "An exciting day of innovation...",
    url: "https://HackDay.butwalhacks.com",
  },
  // Add more events...
]
```

### Mission Pillars

Edit the mission pillars in [components/mission.tsx](components/mission.tsx).

## 🚢 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Deploy on Vercel

The easiest way to deploy is with [Vercel](https://vercel.com/new):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new?utm_medium=default-template&filter=next.js)

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/docs)

---

<p align="center">
  Made with ❤️ by the Butwal Hacks community
</p>
