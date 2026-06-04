import type React from "react"
import type { Metadata, Viewport } from "next"
import Script from "next/script"
import { Inter } from "next/font/google"

import { Analytics } from "@vercel/analytics/next"
import SiteHeader from "@/components/site-header"
import Footer from "@/components/footer"
import { ShellProvider } from "@/components/shell-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { ToastProvider } from "@/components/toast-provider"
import { DevelopmentBanner } from "@/components/development-banner"
import { SmoothScrollWrapper } from "@/components/smooth-scroll-wrapper"
import { siteKeywords } from "@/lib/seo"
import "./globals.css"

/**
 * Inter — clean, highly-legible Google Font used across all UI text.
 * Subsets limited to "latin" to minimise bundle size.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#E73C2D",
}

export const metadata: Metadata = {
  metadataBase: new URL("https://butwalhacks.com"),
  applicationName: "Butwal Hacks",
  category: "nonprofit technology community",
  title: {
    default: "Butwal Hacks",
    template: "%s | Butwal Hacks",
  },
  description:
    "Butwal Hacks is a nonprofit youth technology initiative in Butwal, Rupandehi District, Lumbini Province, Nepal focused on learning, mentorship, and collaborative innovation.",
  keywords: siteKeywords,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  appleWebApp: {
    title: "BtlHcks",
  },
  openGraph: {
    title: "Butwal Hacks",
    description:
      "Butwal Hacks is a nonprofit youth technology initiative in Butwal, Rupandehi District, Lumbini Province, Nepal focused on learning, mentorship, and collaborative innovation.",
    url: "https://butwalhacks.com",
    siteName: "Butwal Hacks",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Butwal Hacks",
    description:
      "Butwal Hacks is a nonprofit youth technology initiative in Butwal, Rupandehi District, Lumbini Province, Nepal focused on learning, mentorship, and collaborative innovation.",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} bg-background font-sans antialiased text-foreground`}>
        {/* Theme sync with system preference — respects user's OS theme setting */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ShellProvider hasGlobalHeader hasGlobalFooter>
            <SmoothScrollWrapper>
              <div className="flex min-h-screen flex-col bg-background text-foreground">
                <DevelopmentBanner />
                <SiteHeader forceRender />
                <div className="flex-1">{children}</div>
                <Footer />
              </div>
            </SmoothScrollWrapper>
            <Analytics />
            <ToastProvider />
          </ShellProvider>
        </ThemeProvider>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}
