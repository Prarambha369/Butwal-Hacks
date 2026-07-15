import { redirect } from "next/navigation"

// Auth0 v4 mounts login at /auth/login via the proxy middleware
export default async function SignInPage() {
  redirect("/auth/login")
}
