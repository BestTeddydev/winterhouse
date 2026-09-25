import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type Role = 'ADMIN' | 'CUSTOMER' | 'OWNER' | 'EMPLOYEE'

// Page access rules. API routes check permissions themselves (see src/lib/api-auth.ts).
const PROTECTED_PAGES: Array<{ prefix: string; roles?: Role[]; redirectAnonymousTo: 'signin' | 'home' }> = [
  { prefix: '/admin', roles: ['ADMIN', 'OWNER'], redirectAnonymousTo: 'home' },
  { prefix: '/owner', roles: ['OWNER'], redirectAnonymousTo: 'signin' },
  { prefix: '/employee', roles: ['EMPLOYEE'], redirectAnonymousTo: 'signin' },
  { prefix: '/bookings', redirectAnonymousTo: 'signin' },
]

// Only allow same-origin relative paths ("//host" would be an open redirect)
function safeCallbackPath(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/'
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  let token = null
  try {
    token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, cookieName: 'next-auth.session-token' })
  } catch (error) {
    console.error('Error reading session token:', error)
  }

  // Signed-in users don't need the sign-in page
  if (pathname.startsWith('/auth')) {
    if (!token) return NextResponse.next()
    return NextResponse.redirect(new URL(safeCallbackPath(req.nextUrl.searchParams.get('callbackUrl')), req.url))
  }

  const rule = PROTECTED_PAGES.find((r) => pathname.startsWith(r.prefix))
  if (!rule) return NextResponse.next()

  if (!token) {
    if (rule.redirectAnonymousTo === 'home') return NextResponse.redirect(new URL('/', req.url))
    const signin = new URL('/auth/signin', req.url)
    signin.searchParams.set('callbackUrl', pathname + search)
    return NextResponse.redirect(signin)
  }

  if (rule.roles && !rule.roles.includes(token.role as Role)) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/bookings/:path*', '/auth/:path*', '/owner/:path*', '/employee/:path*'],
}
