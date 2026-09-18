import { redirect } from "next/navigation"
import { buildPageMetadata } from "@/lib/seo"

// Auth0 v4 mounts sign-up via screen_hint param at /auth/login
// See: https://auth0.com/docs/authenticate/login/auth0-universal-login#how-to-implement

export const metadata = buildPageMetadata({title: "Sign Up", description: "Join Butwal Hacks for free. No experience needed. Get your Hacker ID and start building.", path: "/sign-up", keywords: []});

export default async function SignUpPage() {
  redirect("/auth/login?screen_hint=signup")
}
