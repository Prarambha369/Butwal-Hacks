import { redirect } from "next/navigation"
import { buildPageMetadata } from "@/lib/seo"

// Auth0 v4 mounts the login flow at /auth/login via the proxy middleware.
// The proxy intercepts /auth/login before this page route is ever reached
// on the main domain. This file exists only for path completeness.

export const metadata = buildPageMetadata({title: "Login", description: "Welcome back. Sign in to your free Butwal Hacks account.", path: "/login", keywords: []});

export default function LoginPage() {
  redirect("/auth/login")
}
