import type React from "react"
import type { Metadata, Viewport } from "next"
import Script from "next/script"
import { Inter } from "next/font/google"

import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
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
  themeColor: "#8B0000",
}

export const metadata: Metadata = {
  metadataBase: new URL("https://butwalhacks.com"),
  applicationName: "Butwal Hacks",
  category: "nonprofit technology community",
  title: {
    default: "Butwal Hacks",
    template: "%s | Butwal Hacks",
  },
  description: "A nonprofit tech community focused on learning, mentorship, and collaborative innovation in Butwal and Rupandehi.",
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
  openGraph: {
    title: "Butwal Hacks",
    description: "A nonprofit tech community focused on learning, mentorship, and collaborative innovation in Butwal and Rupandehi.",
    url: "https://butwalhacks.com",
    siteName: "Butwal Hacks",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Butwal Hacks",
    description: "A nonprofit tech community focused on learning, mentorship, and collaborative innovation in Butwal and Rupandehi.",
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
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* Default dark theme — matches the movement's visual identity */}
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
          <Analytics />
        </ThemeProvider>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-NKE935H259" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-NKE935H259');
          `}
        </Script>
      </body>
    </html>
  )
}
