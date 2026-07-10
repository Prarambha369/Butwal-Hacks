import { Auth0Provider } from "@auth0/nextjs-auth0/client";
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-provider";
import { Analytics } from "@vercel/analytics/react";
import { PostHogProvider } from "@/components/posthog-provider";
import PWARegister from "@/components/pwa-register";
import { Toaster } from "sonner";
import FeedbackWidget from "@/components/feedback-widget";
import CommandSearch from "@/components/command-search";
import PWAInstallPrompt from "@/components/pwa-install-prompt";
import NetworkStatus from "@/components/network-status";
import BHBot from "@/components/bh-bot";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import SwipeNavigator from "@/components/swipe-navigator";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://butwalhacks.com";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "NGO",
  "name": "Butwal Hacks",
  "url": baseUrl,
  "logo": `${baseUrl}/icon.svg`,
  "description": "A nonprofit youth technology initiative in Butwal, Nepal, providing hands-on hackathons, mentorship, and innovation opportunities for the next generation of builders.",
  "foundingDate": "2024",
  "areaServed": { "@type": "Place", "name": "Lumbini Province, Nepal" },
  "knowsAbout": ["Technology Education", "Hackathons", "Youth Mentorship"],
  "sameAs": ["https://github.com/Prarambha369/Butwal-Hacks"],
}

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Butwal Hacks — Powering Nepal's Next Generation of Builders",
  description:
    "Butwal Hacks is a nonprofit youth technology initiative in Butwal, Nepal, providing hands-on hackathons, mentorship, and innovation opportunities for the next generation of builders.",
  openGraph: {
    title: "Butwal Hacks — Powering Nepal's Next Generation of Builders",
    description:
      "A nonprofit youth technology initiative in Butwal, Nepal, providing hands-on hackathons, mentorship, and innovation opportunities.",
    url: baseUrl,
    siteName: "Butwal Hacks",
    locale: "en_US",
    type: "website",
    images: [{ url: `${baseUrl}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Butwal Hacks — Powering Nepal's Next Generation of Builders",
    description:
      "A nonprofit youth technology initiative in Butwal, Nepal, providing hands-on hackathons, mentorship, and innovation opportunities.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (        <html lang="en" suppressHydrationWarning>
        <head>
          {/* ponytail: inline JSON-LD — static object, no SSR mismatch risk */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          {/* hreflang for Nepali */}
          <link rel="alternate" hrefLang="ne" href={`${baseUrl}/ne`} />
          <link rel="alternate" hrefLang="en" href={baseUrl} />
          <link rel="alternate" hrefLang="x-default" href={baseUrl} />
          {/* Skip to content link for accessibility */}
        </head>
      <body className="bg-background text-primary transition-colors duration-300 antialiased">
        {/* Skip to content link — first focusable element for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-bh-red-500 focus:text-white focus:text-sm focus:font-bold focus:outline-none focus:ring-2 focus:ring-bh-red-500/50"
        >
          Skip to content
        </a>
        {/* Google Fonts: preconnect + preload for faster loading — Next.js hoists these to <head> */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400..900&family=JetBrains+Mono:wght@400..700&display=swap"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400..900&family=JetBrains+Mono:wght@400..700&display=swap"
        />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <div className="scroll-progress-bar" aria-hidden="true" />
        <Auth0Provider>
          <ThemeProvider>
            <PostHogProvider>
            <div id="main-content" className="relative flex min-h-screen flex-col overflow-x-hidden">
              <LanguageProvider>{children}</LanguageProvider>
            </div>
            </PostHogProvider>
          </ThemeProvider>
          <FeedbackWidget />
          <BHBot />
          <CommandSearch />
        </Auth0Provider>
        {/* ponytail: pb-16 on mobile offsets the fixed bottom nav — md:pb-0 restores on desktop */}
        <div className="pb-16 md:pb-0" />
        <MobileBottomNav />
        <SwipeNavigator />
        <Analytics />
        <PWARegister />
        <PWAInstallPrompt />
        <NetworkStatus />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--glass-bg)",
              backdropFilter: "var(--blur)",
              border: "1px solid var(--glass-border)",
              color: "var(--text-primary)",
              borderRadius: "16px",
            },
          }}
        />
      </body>
    </html>
  );
}
