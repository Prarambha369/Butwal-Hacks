"use client";

import Image from "next/image";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Button } from "@/components/ui/button";
import { useIsClient } from "@/hooks/use-is-client";

export default function ProfilePage() {
  const { user, isLoading } = useUser();
  const mounted = useIsClient();

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen grid place-items-center px-4 py-12 bg-background relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-glow-bh-red-soft blur-[120px] rounded-full pointer-events-none" />
        <div className="lg-surface ring-1 ring-inset ring-glass-highlight shadow-2xl rounded-2xl p-12 flex flex-col items-center space-y-4 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bh-red-500"></div>
          <p className="text-sm text-secondary bh-mono animate-pulse">Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center px-4 py-12 bg-background relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-glow-bh-red-soft blur-[120px] rounded-full pointer-events-none" />
        <div className="lg-surface ring-1 ring-inset ring-glass-highlight shadow-2xl rounded-2xl p-12 flex flex-col items-center text-center space-y-6 z-10">
          <h1 className="text-2xl font-bold text-foreground">Authentication Required</h1>
          <p className="text-secondary text-sm max-w-xs">
            Please sign in to access your profile and hacker identity.
          </p>
          <Button
            variant="default"
            className="rounded-full px-8"
            onClick={() => (window.location.href = "/auth/login")}
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="lg-surface p-8 rounded-[var(--radius-lg)]">
          <h1 className="text-4xl font-bold tracking-tight text-primary leading-[1.1] mb-6">Your Profile</h1>

          <div className="space-y-6">
            <div className="flex items-center space-x-6">
              {user.picture && (
                <div className="relative w-24 h-24">
                  <Image
                    src={user.picture}
                    alt="Profile"
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-semibold text-primary leading-[1.2]">
                  {user.name || "Hacker"}
                </h2>
                <p className="text-[var(--color-text-secondary)]">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="lg-surface rounded-lg p-4">
                <h3 className="font-semibold text-primary">Account Info</h3>
                <p className="text-sm text-secondary">ID: {user.sub}</p>
                <p className="text-sm text-secondary">Email: {user.email}</p>
              </div>

              <div className="lg-surface rounded-lg p-4">
                <h3 className="font-semibold text-primary">Preferences</h3>
                <p className="text-sm text-secondary">Customize your experience</p>
              </div>
            </div>

            <div className="pt-4">
              <Button
                variant="default"
                onClick={() => (window.location.href = "/auth/logout")}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
