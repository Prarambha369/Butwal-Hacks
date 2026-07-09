import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session (important: do not destructure before calling getUser)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Skip API routes and maintenance page for maintenance check
  const isApiRoute = pathname.startsWith("/api/")
  const isMaintenancePage = pathname === "/maintenance"

  // Check maintenance mode (only if not API and not already on maintenance page)
  if (!isApiRoute && !isMaintenancePage) {
    try {
      const { data: siteConfig } = await supabase
        .from("site_config")
        .select("maintenance_mode")
        .single()

      if (siteConfig?.maintenance_mode === true) {
        return NextResponse.redirect(new URL("/maintenance", request.url))
      }
    } catch {
      // If the table doesn't exist or query fails, continue normally
    }
  }

  // Protect /dashboard/* routes — require auth
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // Fetch user role from profiles table
    let userRole: string | null = null
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      userRole = profile?.role ?? null
    } catch {
      // If profiles table doesn't exist, allow access
    }

    // Role-based route protection
    if (userRole) {
      const isHackerRoute = pathname.startsWith("/dashboard/hacker")
      const isOrganizerRoute = pathname.startsWith("/dashboard/organizer")
      const isMaintainerRoute = pathname.startsWith("/dashboard/maintainer")

      if (isHackerRoute && userRole !== "hacker") {
        return NextResponse.redirect(new URL(`/dashboard/${userRole}`, request.url))
      }

      if (isOrganizerRoute && userRole !== "organizer") {
        return NextResponse.redirect(new URL(`/dashboard/${userRole}`, request.url))
      }

      if (isMaintainerRoute && userRole !== "maintainer") {
        return NextResponse.redirect(new URL(`/dashboard/${userRole}`, request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
