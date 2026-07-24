"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, LogIn, LogOut, Search, LayoutDashboard } from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/language-provider';
import { t } from '@/lib/i18n';
import { ThemeToggle } from '@/components/theme-toggle';
import { Skeleton } from '@/components/ui/skeleton';

import { APP_URL } from "@/lib/constants";

function LanguageToggle() {
  const { locale, setLocale } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-w-[44px] min-h-[44px]" />;
  }

  return (
    <button
      onClick={() => setLocale(locale === 'en' ? 'ne' : 'en')}
      className="flex min-w-[44px] min-h-[44px] items-center justify-center rounded-full text-xs font-bold tracking-tight text-muted-foreground hover:text-primary hover:bg-surface-hover transition-all duration-300 active:scale-95"
      aria-label={locale === 'en' ? 'Switch to Nepali' : 'Switch to English'}
    >
      {locale === 'en' ? 'EN' : 'ने'}
    </button>
  );
}

const navLinks = [
  { name: 'Home', href: '/', i18nKey: 'nav.home' },
  { name: 'Community', href: '/community', i18nKey: 'nav.community' },
  { name: 'Events', href: '/events', i18nKey: 'nav.events' },
  { name: 'Explore', href: '/explore', i18nKey: 'nav.explore' },
  { name: 'Insights', href: '/blog', i18nKey: 'nav.insights' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isLoading } = useUser();
  const isSignedIn = !!user;
  const { locale } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        "sticky top-0 z-50 w-full bg-surface transition-all duration-200",
        scrolled ? "border-b border-border shadow-sm" : ""
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-3 group min-h-[44px]">
              <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-deep-red">
                <Image
                  src="/logo.png"
                  alt="Butwal Hacks"
                  fill
                  className="object-cover"
                  sizes="36px"
                  priority
                />
              </div>
              <span className="text-primary font-bold text-lg tracking-tight">
                Butwal Hacks
              </span>
            </Link>
          </div>

          {/* Center: Nav Links (Desktop) */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-text-secondary rounded-md transition-all hover:bg-surface-hover hover:text-primary"
              >
                {t(link.i18nKey, locale)}
              </Link>
            ))}
          </div>

          {/* Right: Search + Auth + Theme Toggle */}
          <div className="hidden md:flex items-center gap-2">
            {/* Cmd+K Search Trigger */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('bh:open-search'))}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-secondary transition-all hover:bg-surface-hover hover:text-primary active:scale-95"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
              <span className="hidden lg:inline">{t('common.search', locale)}</span>
            </button>
            <ThemeToggle />
            <LanguageToggle />
            {isLoading ? (
              /* Skeleton placeholder while Auth0 checks cached session */
              <div className="flex items-center gap-2" aria-hidden="true">
                <Skeleton className="h-9 w-20 rounded-full" />
                <Skeleton className="h-9 w-24 rounded-full" />
              </div>
            ) : isSignedIn ? (
              <>
                <a
                  href={`${APP_URL}/dashboard`}
                  className="bh-btn-primary text-sm !px-4 !py-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </a>
                <a
                  href={`${APP_URL}/auth/logout`}
                  className="bh-btn-ghost text-sm"
                >
                  <LogOut className="h-4 w-4" />
                  {t('nav.sign_out', locale)}
                </a>
              </>
            ) : (
              <>
                <a
                  href={`${APP_URL}/auth/login`}
                  className="bh-btn-ghost text-sm"
                >
                  <LogIn className="h-4 w-4" />
                  {t('nav.sign_in', locale)}
                </a>
                <a
                href={`${APP_URL}/auth/login?screen_hint=signup`}
                className="bh-btn-primary text-sm !px-5"
                >
                  {t('nav.sign_up', locale)}
                </a>
              </>
            )}
          </div>

          {/* Mobile: Search + Theme + Menu */}
          <div className="md:hidden flex items-center gap-1">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('bh:open-search'))}
              className="text-text-secondary min-w-[44px] min-h-[44px] p-2.5 hover:text-primary transition-colors flex items-center justify-center"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
            <ThemeToggle />
            <LanguageToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-primary min-w-[44px] min-h-[44px] p-2.5 flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          "absolute top-full left-0 w-full bg-surface border-b border-border transition-all duration-200 ease-in-out md:hidden shadow-lg max-h-dvh overflow-y-auto",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        )}
      >
        <div className="flex flex-col p-4 pb-8 gap-1 bh-pb-safe">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="px-4 py-3 text-text-secondary text-base font-medium rounded-lg transition-all hover:bg-surface-hover hover:text-primary"
            >
              {t(link.i18nKey, locale)}
            </Link>
          ))}
          {/* Mobile search trigger */}
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('bh:open-search'));
              setIsOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-3 text-text-secondary text-base font-medium rounded-lg transition-all hover:bg-surface-hover hover:text-primary"
          >
            <Search className="h-5 w-5" />
            {t('common.search', locale)}
          </button>
          {isLoading ? (
            /* Skeleton placeholder for mobile nav */
            <div className="mt-4 flex flex-col gap-2" aria-hidden="true">
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ) : isSignedIn ? (
            <>
              <a
                href={`${APP_URL}/dashboard`}
                onClick={() => setIsOpen(false)}
                className="bh-btn-primary text-center"
              >
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </a>
              <a
                href={`${APP_URL}/auth/logout`}
                onClick={() => setIsOpen(false)}
                className="bh-btn-secondary text-center"
              >
                <LogOut className="h-5 w-5" />
                {t('nav.sign_out', locale)}
              </a>
            </>
          ) : (
            <div className="mt-2 flex flex-col gap-2">
              <a
                href={`${APP_URL}/auth/login`}
                onClick={() => setIsOpen(false)}
                className="bh-btn-secondary text-center"
              >
                <LogIn className="h-5 w-5" />
                {t('nav.sign_in', locale)}
              </a>
              <a
                href={`${APP_URL}/auth/login?screen_hint=signup`}
                onClick={() => setIsOpen(false)}
                className="bh-btn-primary text-center"
              >
                {t('nav.sign_up', locale)}
              </a>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
