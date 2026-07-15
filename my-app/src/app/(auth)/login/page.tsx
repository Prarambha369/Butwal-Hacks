import { redirect } from "next/navigation"

// Auth0 v4 mounts the login flow at /auth/login via the proxy middleware.
// The proxy intercepts /auth/login before this page route is ever reached
// on the main domain. This file exists only for path completeness.
export default function LoginPage() {
  redirect("/auth/login")
}
