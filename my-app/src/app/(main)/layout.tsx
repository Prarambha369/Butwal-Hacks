import { LanguageProvider } from "@/components/language-provider";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <LanguageProvider>
        <Navbar />
        <main id="app-content" className="flex-1 relative pb-24 md:pb-0 scroll-mt-24">
          {children}
        </main>
        <Footer />
      </LanguageProvider>
  );
}
