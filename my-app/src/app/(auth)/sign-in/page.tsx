import { redirect } from "next/navigation"

// Auth0 mounts login at /api/auth/login via the [auth0] catch-all route
export default async function SignInPage() {
  redirect("/api/auth/login")
}
