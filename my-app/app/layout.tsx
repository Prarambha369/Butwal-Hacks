import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import TopNav from "@/components/top-nav";
import BottomNav from "@/components/bottom-nav";
import Footer from "@/components/footer";
import MaintenanceBanner from "@/components/maintenance-banner";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Butwal Hacks | Redesign",
  description: "Building the future of youth tech in Nepal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-bg-primary text-text-primary transition-colors duration-300 antialiased">
        <ThemeProvider>
          <div className="flex flex-col min-h-screen relative overflow-x-hidden">
            <MaintenanceBanner />
            <TopNav />
            {/* Main content wrapper with padding for BottomNav accessibility */}
            <main className="flex-1 relative pb-24 md:pb-0">
              {children}
            </main>
            <Footer />
            <BottomNav />
          </div>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
