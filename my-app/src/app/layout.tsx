import { Auth0Provider } from "@auth0/nextjs-auth0/client";
import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
  preload: true,
});
import { LanguageProvider } from "@/components/language-provider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { PostHogProvider } from "@/components/posthog-provider";
import PWARegister from "@/components/pwa-register";
import { Toaster } from "sonner";
import AssistantPanel from "@/components/assistant-panel";
import SafeJsonLd from "@/lib/json-ld";
import CommandSearch from "@/components/command-search";
import PWAInstallPrompt from "@/components/pwa-install-prompt";
import NetworkStatus from "@/components/network-status";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import SwipeNavigator from "@/components/swipe-navigator";
import CookieConsentBanner from "@/components/cookie-consent-banner";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://butwalhacks.com";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "NGO",
  "name": "Butwal Hacks",
  "url": baseUrl,
  "logo": `${baseUrl}/icon.svg`,
  "description": "A student-run nonprofit organizing free hackathons, hands-on workshops, and project-based learning for young builders in Nepal.",
  "foundingDate": "2024",
  "areaServed": { "@type": "Place", "name": "Lumbini Province, Nepal" },
  "knowsAbout": ["Technology Education", "Hackathons", "Youth Mentorship"],
  "sameAs": ["https://github.com/Prarambha369/Butwal-Hacks"],
}

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Butwal Hacks — Build, Ship, and Earn Verified Credentials in Nepal",
  description:
    "A student-run nonprofit organizing free hackathons, hands-on workshops, and project-based learning for young builders in Nepal.",
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    title: "Butwal Hacks — Build, Ship, and Earn Verified Credentials in Nepal",
    description:
      "A student-run nonprofit organizing free hackathons and hands-on workshops for young builders in Nepal.",
    url: baseUrl,
    siteName: "Butwal Hacks",
    locale: "en_US",
    type: "website",
    images: [{
      url: `${baseUrl}/og-image.png`,
      width: 1200,
      height: 630,
      alt: "Butwal Hacks — Build, Ship, and Earn Verified Credentials in Nepal",
      type: "image/png",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Butwal Hacks — Build, Ship, and Earn Verified Credentials in Nepal",
    description:
      "A student-run nonprofit organizing free hackathons and hands-on workshops for young builders in Nepal.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (        <html lang="en" suppressHydrationWarning className={`${dmSans.variable} ${jetbrainsMono.variable}`}>
        <head>
          {/* ══ FOUC prevention: set .dark class before React hydrates ══
             Reads localStorage (user override) or prefers-color-scheme (system),
             defaults to dark. Must run synchronously before first paint. */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var e=localStorage.getItem("bh-theme");if(e==="dark"||e==="light"){document.documentElement.classList.toggle("dark",e==="dark");return}if(window.matchMedia("(prefers-color-scheme:dark)").matches){document.documentElement.classList.add("dark")}}catch(e){}})()`
            }}
          />
          <SafeJsonLd data={jsonLd} />
          {/* hreflang for Nepali */}
          <link rel="alternate" hrefLang="ne" href={`${baseUrl}/ne`} />
          <link rel="alternate" hrefLang="en" href={baseUrl} />
          <link rel="alternate" hrefLang="x-default" href={baseUrl} />

          {/* ══ Favicon / Icons ══ */}
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="icon" href="/icon.svg" type="image/svg+xml" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
          <link rel="manifest" href="/manifest.webmanifest" />
          <meta name="theme-color" content="#FE0000" />
          <meta name="apple-mobile-web-app-title" content="Butwal Hacks" />
          </head>
      <body className="bg-background text-primary transition-colors duration-300 antialiased" suppressHydrationWarning>
        <div className="scroll-progress-bar" aria-hidden="true" />
        {/* ══ Skip-to-content link — visible on keyboard focus, hidden otherwise ══ */}
        <a
          href="#app-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:flex focus:items-center focus:gap-2 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-primary focus:ring-2 focus:ring-primary-red focus:ring-offset-2 focus:ring-offset-background focus:shadow-lg"
        >
          Skip to content
        </a>
        <Auth0Provider>
            <PostHogProvider>
            <div id="app-content" tabIndex={-1} className="relative flex min-h-dvh flex-col overflow-x-hidden outline-none">
              <LanguageProvider>{children}</LanguageProvider>
            </div>
            </PostHogProvider>
          <AssistantPanel />
          <CommandSearch />
        </Auth0Provider>
        {/* ponytail: pb-16 on mobile offsets the fixed bottom nav — md:pb-0 restores on desktop */}
        <div className="pb-16 md:pb-0" />
        {/* ══ Deferred (non-critical): mount after first paint ══
             DeferredMount wrapper deleted (ponytail audit cut — the rAF deferral
             was premature for MVP scale. Components render directly instead.) */}
        <MobileBottomNav />
        <SwipeNavigator />
        <Analytics />
        <SpeedInsights />
        <PWARegister />
        <PWAInstallPrompt />
        <NetworkStatus />
        <CookieConsentBanner />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#FFFFFF",
              border: "1px solid #E5E5E5",
              color: "#1F1F1F",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            },
          }}
        />
      </body>
    </html>
  );
}
