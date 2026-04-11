import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Create a server client to run auth logic and update cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not fetch the user here if you only want to refresh the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect routes based on auth + onboarding + subscription rules
  const path = request.nextUrl.pathname

  // Public paths that do not require auth at all
  const publicPaths = ['/login', '/register', '/forgot-password', '/auth/callback']
  const isPublicPath = publicPaths.some(p => path.startsWith(p))

  if (!user && !isPublicPath) {
    // Redirect unauthenticated users trying to access protected paths to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isPublicPath) {
    // Redirect authenticated users away from public auth paths to home
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // NOTE: Onboarding and Subscription gating logic will run in higher level Layouts
  // or here once we have the company data fetching setup efficiently.

  return supabaseResponse
}
