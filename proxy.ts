import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Fully bypass middleware for public mobile/external pages — no auth needed
  // and calling supabase.auth.getUser() from middleware can hang when accessed via IP.
  // Also bypass Stripe webhook — it's a server-to-server POST with no session cookie.
  if (
    path.startsWith('/upload') ||
    path.startsWith('/semneaza') ||
    path.startsWith('/api/stripe/webhook') ||
    path.startsWith('/termeni-si-conditii') ||
    path.startsWith('/politica-de-confidentialitate')
  ) {
    return NextResponse.next()
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
