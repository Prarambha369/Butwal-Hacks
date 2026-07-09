import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: process.env.NEXT_PUBLIC_SITE_URL + "/auth/callback",
    },
  })

  if (error || !data.url) {
    return NextResponse.redirect(new URL("/login?error=oauth", request.url))
  }

  return NextResponse.redirect(data.url)
}
