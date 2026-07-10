import { redirect } from "next/navigation"

// Auth0 mounts logout at /api/auth/logout via the [auth0] catch-all route
export default function SignOutPage() {
  redirect("/api/auth/logout")
}
