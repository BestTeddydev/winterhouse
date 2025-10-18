import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
    const isAdminPage = req.nextUrl.pathname.startsWith('/admin')
    const isBookingPage = req.nextUrl.pathname.startsWith('/bookings')

    // If user is on auth page and already authenticated, redirect to callbackUrl or home
    if (isAuthPage && isAuth) {
      const callbackUrl = req.nextUrl.searchParams.get('callbackUrl')
      if (callbackUrl && callbackUrl.startsWith('/')) {
        return NextResponse.redirect(new URL(callbackUrl, req.url))
      }
      return NextResponse.redirect(new URL('/', req.url))
    }
    
    // If user is on admin page and not authenticated, redirect to signin
    if (isAdminPage && !isAuth) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    // If user is on admin page and not admin, redirect to home
    if (isAdminPage && isAuth && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // If user is on booking page and not authenticated, redirect to signin
    if (isBookingPage && !isAuth) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
        const isAdminPage = req.nextUrl.pathname.startsWith('/admin')
        const isBookingPage = req.nextUrl.pathname.startsWith('/bookings')

        console.log('Authorized callback - Token:', token)
        console.log('Authorized callback - Path:', req.nextUrl.pathname)

        // Allow access to auth pages without token
        if (isAuthPage) {
          return true
        }

        // For admin and booking pages, allow access and let the middleware handle redirects
        if (isAdminPage || isBookingPage) {
          return true
        }

        // Allow access to other pages
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/bookings/:path*',
    '/auth/:path*',
  ],
}
