"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, LogIn, LogOut, Search, LayoutDashboard, Settings, ChevronDown } from 'lucide-react';
import { useAuthUser } from '@/components/auth-user-provider';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/language-provider';
import { t } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import { ThemeToggle } from '@/components/theme-toggle';
import { Skeleton } from '@/components/ui/skeleton';

import { APP_URL } from "@/lib/constants";

/**
 * Switches the active locale (English/Nepali).
 *
 * Renders placeholder text until mounted, because the persisted locale is
 * only readable on the client and a server render would flash the wrong
 * language.
 */
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
  { name: 'Events', href: '/events', i18nKey: 'nav.events' },
  { name: 'Explore', href: '/explore', i18nKey: 'nav.explore' },
  { name: 'Insights', href: '/blog', i18nKey: 'nav.insights' },
];

/**
 * Signed-in user menu — avatar button opening Dashboard / Profile settings /
 * Sign out. Closes on outside click or Escape. All labels localized.
 */
function UserMenu({ name, email, picture, locale }: { name?: string; email?: string; picture?: string; locale: Locale }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = (name || email || "?").charAt(0).toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-border p-1 pr-1.5 transition-all hover:border-primary/40 hover:bg-surface-hover active:scale-95"
        aria-label="Account menu"
        aria-expanded={open}
      >
        {picture ? (
          <Image src={picture} alt={name || "Profile"} width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-red text-sm font-bold text-white">
            {initial}
          </span>
        )}
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            {picture ? (
              <Image src={picture} alt="" width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-red text-sm font-bold text-white">
                {initial}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-primary">{name || "Hacker"}</p>
              {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
            </div>
          </div>
          <div className="p-1.5">
            <a
              href={`${APP_URL}/dashboard`}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-primary"
            >
              <LayoutDashboard className="h-4 w-4" /> {t('nav.dashboard', locale)}
            </a>
            <a
              href={`${APP_URL}/dashboard/profile`}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-primary"
            >
              <Settings className="h-4 w-4" /> {t('nav.profile_settings', locale)}
            </a>
            <a
              href={`${APP_URL}/auth/logout`}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-primary"
            >
              <LogOut className="h-4 w-4" /> {t('nav.sign_out', locale)}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Site header.
 *
 * Signed-out visitors get Sign in / Sign up; signed-in users get the
 * avatar UserMenu on both desktop and mobile. All labels go through `t()`
 * so the Nepali locale is honoured.
 */
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isLoading } = useAuthUser();
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
              <Image
                src="/favicon.svg"
                alt="Butwal Hacks"
                width={40}
                height={40}
                className="h-10 w-10"
                priority
              />
              <span className="text-primary font-bold text-lg tracking-tight">
                Butwal Hacks
              </span>
            </Link>
          </div>

          {/* Center: Nav Links (Desktop) — lg and up; the full link +
              search + auth cluster needs ~1024px and clips at md */}
          <div className="hidden lg:flex items-center gap-1">
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
          <div className="hidden lg:flex items-center gap-2">
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
              <UserMenu
                name={user?.name}
                email={user?.email}
                picture={user?.picture}
                locale={locale}
              />
            ) : (
              <>
                <a
                  href={`${APP_URL}/auth/login?returnTo=/dashboard`}
                  className="bh-btn-ghost text-sm"
                >
                  <LogIn className="h-4 w-4" />
                  {t('nav.sign_in', locale)}
                </a>
                <a
                href={`${APP_URL}/auth/login?screen_hint=signup&returnTo=/dashboard/onboarding`}
                className="bh-btn-primary text-sm !px-5"
                >
                  {t('nav.sign_up', locale)}
                </a>
              </>
            )}
          </div>

          {/* Mobile: Search + Theme + Menu */}
          <div className="lg:hidden flex items-center gap-1">
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
          "absolute top-full left-0 w-full bg-surface border-b border-border transition-all duration-200 ease-in-out lg:hidden shadow-lg max-h-dvh overflow-y-auto",
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
              <div className="flex items-center gap-3 px-4 py-3">
                {user?.picture ? (
                  <Image src={user.picture} alt={user?.name || "Profile"} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-red text-base font-bold text-white">
                    {(user?.name || user?.email || "?").charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-primary">{user?.name || "Hacker"}</p>
                  {user?.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
                </div>
              </div>
              <a
                href={`${APP_URL}/dashboard`}
                onClick={() => setIsOpen(false)}
                className="bh-btn-primary text-center"
              >
                <LayoutDashboard className="h-5 w-5" />
                {t('nav.dashboard', locale)}
              </a>
              <a
                href={`${APP_URL}/dashboard/profile`}
                onClick={() => setIsOpen(false)}
                className="bh-btn-secondary text-center"
              >
                <Settings className="h-5 w-5" />
                {t('nav.profile_settings', locale)}
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
                href={`${APP_URL}/auth/login?returnTo=/dashboard`}
                onClick={() => setIsOpen(false)}
                className="bh-btn-secondary text-center"
              >
                <LogIn className="h-5 w-5" />
                {t('nav.sign_in', locale)}
              </a>
              <a
                href={`${APP_URL}/auth/login?screen_hint=signup&returnTo=/dashboard/onboarding`}
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
