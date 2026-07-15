import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

const sitemapGroups = [
  {
    label: 'Events & Projects',
    links: [
      { name: 'All Events', href: '/events' },
      { name: 'Event List', href: '/events/list' },
      { name: 'Event Gallery', href: '/gallery' },
      { name: 'Featured Projects', href: '/projects' },
      { name: 'Initiatives', href: '/initiatives' },
    ],
  },
  {
    label: 'Community',
    links: [
      { name: 'Community Hub', href: '/community' },
      { name: 'Explore Members', href: '/explore' },
      { name: 'Chapters', href: '/chapters' },
      { name: 'Opportunities', href: '/opportunities' },
      { name: 'Sponsor Portal', href: '/portal/sponsors' },
    ],
  },
  {
    label: 'Learn & Resources',
    links: [
      { name: 'Blog & Insights', href: '/blog' },
      { name: 'Resources', href: '/resources' },
      { name: 'Documentation', href: '/docs' },
      { name: 'Donors', href: '/donors' },
      { name: 'Annual Report', href: '/annual-report' },
    ],
  },
  {
    label: 'About',
    links: [
      { name: 'About Us', href: '/about' },
      { name: 'Philosophy', href: '/philosophy' },
      { name: 'Sponsor Prospectus', href: '/support' },
      { name: 'Transparency', href: '/transparency' },
      { name: 'Governance', href: '/governance' },
      { name: 'Contact Us', href: '/contact' },
    ],
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-20 md:px-20">
        {/* Brand Statement */}
        <div className="mb-16 text-center space-y-4">
          <p className="text-2xl md:text-4xl font-bold text-primary">
            Student-run, community-funded.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
            A youth-led nonprofit organizing free hackathons, hands-on workshops, and project-based learning for students across Lumbini Province, Nepal.
          </p>
        </div>

        {/* Sitemap Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-10 mb-16">
          {sitemapGroups.map((group) => (
            <div key={group.label} className="space-y-5">
              <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {group.label}
              </h2>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary-red transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Brand Mark */}
        <div className="text-center py-12 border-t border-border">
          <span className="font-black text-4xl md:text-6xl tracking-tighter text-primary">
            Butwal<span className="text-primary-red">Hacks</span>
          </span>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-primary-red mt-3">
            Learn. Build. Ship.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-3">
            <p className="text-xs font-mono text-muted-foreground/60 text-center md:text-left">
              &copy; {currentYear} Butwal Hacks. A community-led collective funded via Open Collective.
            </p>
            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </div>
          <div className="flex items-center gap-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <Link href="/legal/privacy" className="hover:text-primary-red transition-colors">
              Privacy
            </Link>
            <Link href="/legal/terms" className="hover:text-primary-red transition-colors">
              Terms
            </Link>
            <Link href="/cookie-policy" className="hover:text-primary-red transition-colors">
              Cookies
            </Link>
            <Link href="/sitemap" className="hover:text-primary-red transition-colors">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
