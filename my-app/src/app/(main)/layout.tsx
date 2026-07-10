import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-provider";
import SiteHeader from "@/components/site-header";
import Footer from "@/components/sections/Footer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <SiteHeader />
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <main id="main-content" tabIndex={-1} className="flex-1 relative pb-24 md:pb-0">
          {children}
        </main>
        <Footer />
      </LanguageProvider>
    </ThemeProvider>
  );
}
