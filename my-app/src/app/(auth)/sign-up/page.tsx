import { redirect } from "next/navigation"

// Auth0 v4 mounts sign-up via screen_hint param at /auth/login
// See: https://auth0.com/docs/authenticate/login/auth0-universal-login#how-to-implement
export default async function SignUpPage() {
  redirect("/auth/login?screen_hint=signup")
}
