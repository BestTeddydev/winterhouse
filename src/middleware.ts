import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
    const isAdminPage = req.nextUrl.pathname.startsWith('/admin')
    const isBookingPage = req.nextUrl.pathname.startsWith('/bookings')

    console.log('🛡️ Middleware - Path:', req.nextUrl.pathname)
    console.log('🛡️ Middleware - Is Auth:', isAuth)
    console.log('🛡️ Middleware - Role:', token?.role)

    // If user is on auth page and already authenticated, redirect to callbackUrl or home
    if (isAuthPage && isAuth) {
      console.log('✅ User authenticated, redirecting from auth page')
      const callbackUrl = req.nextUrl.searchParams.get('callbackUrl')
      if (callbackUrl && callbackUrl.startsWith('/')) {
        return NextResponse.redirect(new URL(callbackUrl, req.url))
      }
      return NextResponse.redirect(new URL('/', req.url))
    }
    
    // Admin page protection - check authentication
    if (isAdminPage) {
      if (!isAuth) {
        console.log('❌ Admin page - Not authenticated, redirecting to signin')
        return NextResponse.redirect(new URL('/auth/signin?callbackUrl=' + encodeURIComponent(req.nextUrl.pathname), req.url))
      }
      
      if (token?.role !== 'ADMIN') {
        console.log('❌ Admin page - Not admin role, redirecting to home')
        return NextResponse.redirect(new URL('/', req.url))
      }
      
      console.log('✅ Admin page - Access granted')
    }

    // Booking page protection - check authentication
    if (isBookingPage && !isAuth) {
      console.log('❌ Booking page - Not authenticated, redirecting to signin')
      return NextResponse.redirect(new URL('/auth/signin?callbackUrl=' + encodeURIComponent(req.nextUrl.pathname), req.url))
    }

    console.log('✅ Middleware passed, allowing request')
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
        const isAdminPage = req.nextUrl.pathname.startsWith('/admin')
        const isBookingPage = req.nextUrl.pathname.startsWith('/bookings')

        console.log('🔐 Authorized callback - Path:', req.nextUrl.pathname)
        console.log('🔐 Authorized callback - Has Token:', !!token)
        console.log('🔐 Authorized callback - Role:', token?.role)

        // Allow access to auth pages without token
        if (isAuthPage) {
          console.log('✅ Auth page - Allow access')
          return true
        }

        // For admin and booking pages, we need to check in the middleware function
        if (isAdminPage || isBookingPage) {
          console.log('✅ Admin/Booking page - Allow to middleware for check')
          return true
        }

        // Allow access to other pages
        console.log('✅ Public page - Allow access')
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
