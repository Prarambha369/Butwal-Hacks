import type React from "react"
import type { Metadata, Viewport } from "next"

import { Analytics } from "@vercel/analytics/next"
import { ThemeToggle } from "@/components/theme-toggle"
import "./globals.css"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#8B0000",
}

export const metadata: Metadata = {
  metadataBase: new URL("https://butwalhacks.com"),
  title: "Butwal Hacks: Decentralizing Nepal's Tech Innovation",
  description:
    "A non-profit initiative empowering youth in Butwal and Rupandehi to foster a thriving regional hub for technology and collaboration.",
  alternates: {
    canonical: "/",
  },
  generator: "v0.app",
  openGraph: {
    title: "Butwal Hacks: Decentralizing Nepal's Tech Innovation",
    description:
      "A non-profit initiative empowering youth in Butwal and Rupandehi to foster a thriving regional hub for technology and collaboration.",
    url: "https://butwalhacks.com",
    siteName: "Butwal Hacks",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Butwal Hacks: Decentralizing Nepal's Tech Innovation",
    description:
      "A non-profit initiative empowering youth in Butwal and Rupandehi to foster a thriving regional hub for technology and collaboration.",
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'light';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-NKE935H259"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-NKE935H259');
            `,
          }}
        />
      </head>
      <body className={`font-sans antialiased`}>
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
