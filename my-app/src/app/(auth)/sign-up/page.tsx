import { redirect } from "next/navigation"

// Auth0 mounts sign-up via screen_hint param
// See: https://auth0.com/docs/authenticate/login/auth0-universal-login#how-to-implement
export default async function SignUpPage() {
  redirect("/api/auth/login?screen_hint=signup")
}
