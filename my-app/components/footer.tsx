"use client"

import { Instagram, Linkedin, Link2, Mail, Moon, ShieldCheck } from "lucide-react"
import Link from "next/link"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-background px-4 pt-14 pb-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-[1.35fr_1fr_1fr_1fr_1fr]">
          <section>
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-primary/10 text-sm font-bold text-primary">
                b
              </span>
              <h3 className="text-2xl font-bold font-heading text-foreground">BUTWAL HACKS</h3>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              A youth-led non-profit initiative empowering youth in Butwal and Rupandehi to foster a thriving regional
              hub for technology and collaboration.
            </p>
            <p className="mt-5 text-sm font-medium text-primary">⚡ Built with volunteers. Powered by community.</p>
          </section>

           <nav aria-label="Organization links">
             <h4 className="mb-4 text-base font-bold uppercase tracking-wide text-foreground">Organization</h4>
             <ul className="space-y-2.5 text-sm">
               <li><Link href="/about" className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">About Us</Link></li>
               <li><Link href="/governance" className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">Governance</Link></li>
               <li><Link href="/philosophy" className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">Our Mission</Link></li>
               <li><Link href="/community" className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">Our Team</Link></li>
               <li><Link href="/support" className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">Partners</Link></li>
               <li><Link href="/donors" className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">Impact Report</Link></li>
             </ul>
           </nav>

           <nav aria-label="Programs links">
             <h4 className="mb-4 text-base font-bold uppercase tracking-wide text-foreground">Programs</h4>
             <ul className="space-y-2.5 text-sm">
               <li><Link href="/initiatives/hackathon" className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">Annual Hackathon</Link></li>
               <li><Link href="/events/daydream-butwal-september-2024" className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">Daydream Butwal</Link></li>
               <li><Link href="/events" className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">Community Events</Link></li>
               <li><Link href="/initiatives/gamejam" className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">Workshops & Jams</Link></li>
               <li><Link href="/support" className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">Volunteer With Us</Link></li>
             </ul>
           </nav>

           <nav aria-label="Resource links">
             <h4 className="mb-4 text-base font-bold uppercase tracking-wide text-foreground">Resources</h4>
             <ul className="space-y-2.5 text-sm">
               <li><Link href="/resources" className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">Media Kit</Link></li>
               <li><Link href="/docs" className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">Brand Guide</Link></li>
               <li><Link href="/explore" className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">FAQs</Link></li>
               <li><Link href="/privacy-policy" className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">Privacy Policy</Link></li>
               <li><Link href="/terms-of-service" className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">Terms & Conditions</Link></li>
               <li><Link href="/cookie-policy" className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">Cookie Policy</Link></li>
             </ul>
           </nav>

           <section>
             <h4 className="mb-4 text-base font-bold uppercase tracking-wide text-foreground">Connect</h4>
             <ul className="space-y-3 text-sm">
               <li>
                 <a href="https://linktr.ee" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                   <Link2 className="h-4 w-4" /> Linktree
                 </a>
               </li>
               <li>
                 <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                   <Instagram className="h-4 w-4" /> Instagram
                 </a>
               </li>
               <li>
                 <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                   <Linkedin className="h-4 w-4" /> LinkedIn
                 </a>
               </li>
               <li>
                 <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                   <span className="text-xs font-semibold">X</span> Twitter / X
                 </a>
               </li>
               <li>
                 <a href="mailto:hello@butwalhacks.com" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                   <Mail className="h-4 w-4" /> hello@butwalhacks.com
                 </a>
               </li>
             </ul>
           </section>
        </div>

        <div className="mt-10 border-t border-border pt-5">
          <div className="flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <p>© {currentYear} Butwal Hacks Foundation.</p>
              <span className="hidden md:inline">|</span>
              <p>A youth-led nonprofit initiative under Nepal Hacks Foundation.</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                System Status: Operational
              </span>
              <Moon className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
