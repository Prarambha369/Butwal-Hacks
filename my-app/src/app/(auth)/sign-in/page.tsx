import { redirect } from "next/navigation"
import { buildPageMetadata } from "@/lib/seo"

// Single local auth entry. Auth0 Universal Login does the real work at
// /auth/login (mounted by the proxy middleware); this page only translates
// our own conventions: ?mode=signup selects the signup tab, and returnTo
// is forwarded so callers land back where they started.
//
// When no returnTo is given (e.g. a fresh signup), default to the onboarding
// gate so new users always see role selection instead of landing on the
// marketing homepage with no next step.

export const metadata = buildPageMetadata({title: "Sign In", description: "Welcome back. Sign in to your free Butwal Hacks account.", path: "/sign-in", keywords: []});

/**
 * Sign-in page. Defaults `returnTo` to the onboarding hub so a user who
 * followed a protected link still lands where they were headed; an explicit
 * `returnTo` (or `mode=signup`) from the Navbar always wins.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; returnTo?: string }>;
}) {
  const { mode, returnTo } = await searchParams;
  const qs = new URLSearchParams();
  if (mode === "signup") qs.set("screen_hint", "signup");
  qs.set("returnTo", returnTo || "/dashboard/onboarding");
  const suffix = qs.toString();
  redirect(`/auth/login${suffix ? `?${suffix}` : ""}`);
}
