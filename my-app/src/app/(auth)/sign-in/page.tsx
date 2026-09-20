import { redirect } from "next/navigation"
import { buildPageMetadata } from "@/lib/seo"

// Single local auth entry. Auth0 Universal Login does the real work at
// /auth/login (mounted by the proxy middleware); this page only translates
// our own conventions: ?mode=signup selects the signup tab, and returnTo
// is forwarded so callers land back where they started.

export const metadata = buildPageMetadata({title: "Sign In", description: "Welcome back. Sign in to your free Butwal Hacks account.", path: "/sign-in", keywords: []});

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; returnTo?: string }>;
}) {
  const { mode, returnTo } = await searchParams;
  const qs = new URLSearchParams();
  if (mode === "signup") qs.set("screen_hint", "signup");
  if (returnTo) qs.set("returnTo", returnTo);
  const suffix = qs.toString();
  redirect(`/auth/login${suffix ? `?${suffix}` : ""}`);
}
