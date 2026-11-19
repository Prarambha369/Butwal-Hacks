import Link from "next/link";
import type { Metadata } from "next";
import { UserRoundCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "You already have an account",
  robots: { index: false, follow: false },
};

// Reached from the dashboard bootstrap when this login's email already
// belongs to a profile created with a different sign-in method (e.g. Google
// first, GitHub now). Creating a second profile is the duplicate-account bug,
// so the member is pointed at linking instead.
export default function AccountExistsPage() {
  return (
    <main className="min-h-dvh bg-background pt-28 pb-20 px-6">
      <div className="bh-card mx-auto max-w-lg p-8 md:p-10 text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-hover">
          <UserRoundCheck className="h-7 w-7 text-primary-red" aria-hidden="true" />
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-primary">You already have an account</h1>
          <p className="text-muted-foreground">
            This email is already on a Butwal Hacks profile that you created with a different
            sign-in method. We didn&apos;t make a second account, so your events, teams and badges
            stay in one place.
          </p>
        </div>
        <ol className="space-y-2 text-left text-sm text-secondary list-decimal pl-5">
          <li>Sign out, then sign in the way you did the first time.</li>
          <li>
            Open <span className="font-semibold text-primary">Dashboard → Connections</span> and link
            this sign-in method, so either one works from now on.
          </li>
        </ol>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/auth/logout"
            className="inline-flex items-center justify-center rounded-full bg-bh-red-action px-6 py-3 text-sm font-bold text-white hover:bg-deep-red transition-colors"
          >
            Sign out and switch
          </a>
          <Link
            href="/support"
            className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-6 py-3 text-sm font-bold text-primary hover:bg-surface-hover transition-colors"
          >
            Get help
          </Link>
        </div>
      </div>
    </main>
  );
}
