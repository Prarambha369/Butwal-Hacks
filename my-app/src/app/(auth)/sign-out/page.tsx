import { redirect } from "next/navigation"

// Auth0 v4 mounts logout at /auth/logout via the proxy middleware
export default function SignOutPage() {
  redirect("/auth/logout")
}
