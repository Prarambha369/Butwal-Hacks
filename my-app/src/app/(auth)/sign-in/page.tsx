import { redirect } from "next/navigation"
import { buildPageMetadata } from "@/lib/seo"

// Auth0 v4 mounts login at /auth/login via the proxy middleware

export const metadata = buildPageMetadata({title: "Sign In", description: "Sign in to your Butwal Hacks account", path: "/sign-in", keywords: []});

export default async function SignInPage() {
  redirect("/auth/login")
}
