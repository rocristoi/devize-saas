import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

// ─── Subscription gate ────────────────────────────────────────────────────────
// Returns true when the user's subscription has lapsed and they must be blocked.
// Runs a lightweight query using the service-role client (no RLS overhead).
async function checkSubscriptionBlocked(userId: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return false

  const db = createSupabaseAdmin(url, key, { auth: { persistSession: false } })

  const { data: sub } = await db
    .from('billing_subscriptions')
    .select('status, current_period_end')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!sub) return false

  const { status, current_period_end } = sub as {
    status: string
    current_period_end: string | null
  }

  const now = new Date()
  const periodEnd = current_period_end ? new Date(current_period_end) : null

  if (status === 'expired') return true

  if (status === 'canceled' || status === 'overdue') {
    if (!periodEnd) return true
    return periodEnd < now
  }

  return false
}

export async function updateSession(request: NextRequest) {
  // Inject the current pathname as a request header so Server Components
  // (e.g. the (app) layout) can read it via `headers()` from `next/headers`.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
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
            request: { headers: requestHeaders },
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

  // Public paths specifically for authentication
  const authPaths = ['/login', '/register', '/forgot-password', '/auth/callback']
  const isAuthPath = authPaths.some(p => path.startsWith(p))

  // Paths that are auth-related but must be accessible even when already logged in
  // (e.g., password reset - user is "logged in" temporarily to update their password)
  const alwaysAllowedPaths = ['/reset-password']
  const isAlwaysAllowed = alwaysAllowedPaths.some(p => path.startsWith(p))

  // Neutral public paths (allow both authenticated and unauthenticated to view)
  const neutralPaths = ['/upload', '/semneaza', '/api/deviz/public-pdf', '/api/deviz/sign', '/termeni-si-conditii', '/politica-de-confidentialitate']
  const isNeutralPath = neutralPaths.some(p => path.startsWith(p))

  const isPublicPath = isAuthPath || isNeutralPath || isAlwaysAllowed

  if (!user && !isPublicPath) {
    // Redirect unauthenticated users trying to access protected paths to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthPath && !isAlwaysAllowed) {
    // Redirect authenticated users away from public auth paths to home
    // (but NOT from /reset-password — they need to be there to update their password)
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // ── Subscription gate ────────────────────────────────────────────────────
  // Only runs for authenticated users accessing protected (app/API) routes.
  if (user) {
    // Paths allowed even when subscription is blocked:
    //  - /abonament (subscription management page and sub-routes like /pay, /rezultat)
    //  - /api/stripe/* (checkout, portal, webhook — needed to resubscribe)
    //  - /api/subscriptions/* (internal subscription management)
    //  - /onboarding (account setup)
    //  - /auth/* (auth callbacks)
    //  - /api/deviz/public-pdf, /api/deviz/sign (already in neutralPaths)
    const subscriptionAllowedPaths = [
      '/abonament',
      '/api/stripe',
      '/api/subscriptions',
      '/onboarding',
      '/auth',
    ]
    const isSubscriptionAllowed = subscriptionAllowedPaths.some(p => path.startsWith(p))

    if (!isSubscriptionAllowed && !isPublicPath) {
      const blocked = await checkSubscriptionBlocked(user.id)
      if (blocked) {
        // For API routes return 402 Payment Required instead of redirecting
        if (path.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'subscription_required', message: 'Your subscription has expired. Please renew to continue.' },
            { status: 402 }
          )
        }
        // For page routes redirect to the subscription blocked page
        const url = request.nextUrl.clone()
        url.pathname = '/abonament/blocat'
        return NextResponse.redirect(url)
      }
    }

    // Forward the pathname so server layouts can skip the subscription check
    // for /abonament/* without having to query the DB a second time.
    // (Already injected into the request headers at the top of updateSession.)
  }

  // NOTE: Onboarding and Subscription gating logic will run in higher level Layouts
  // or here once we have the company data fetching setup efficiently.

  return supabaseResponse
}
