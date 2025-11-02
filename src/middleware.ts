import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Log environment info for debugging
  console.log('🔍 Middleware Debug Info:')
  console.log('  - NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET)
  console.log('  - NEXTAUTH_SECRET length:', process.env.NEXTAUTH_SECRET?.length || 0)
  console.log('  - NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
  console.log('  - NODE_ENV:', process.env.NODE_ENV)
  console.log('  - Request URL:', req.url)
  console.log('  - Request domain:', req.nextUrl.hostname)
  
  // Log all cookies for debugging
  const cookies = req.cookies.getAll()
  console.log('🍪 Request cookies:', cookies.map(c => ({ name: c.name, exists: !!c.value })))
  
  let token
  try {
    token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: 'next-auth.session-token'
    })
    console.log('✅ Token fetched successfully')
  } catch (error) {
    console.error('❌ Error fetching token:', error)
    token = null
  }
  
  const isAuth = !!token
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
  const isAdminPage = req.nextUrl.pathname.startsWith('/admin')
  const isBookingPage = req.nextUrl.pathname.startsWith('/bookings')
  const isOwnerPage = req.nextUrl.pathname.startsWith('/owner')

  console.log('🛡️ Middleware - Path:', req.nextUrl.pathname)
  console.log('🛡️ Middleware - Is Auth:', isAuth)
  console.log('🛡️ Middleware - Token exists:', !!token)
  console.log('🛡️ Middleware - Role:', token?.role)
  console.log('🛡️ Middleware - Token data:', token ? {
    id: token.id,
    role: token.role,
    name: token.name
  } : 'No token')

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
      return NextResponse.redirect(new URL('/', req.url))
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
    return NextResponse.redirect(new URL('/auth/signin?callbackUrl=' + encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search), req.url))
  }

  // Owner page protection - check authentication and authorization
  if (isOwnerPage) {
    if (!isAuth) {
      console.log('❌ Owner page - Not authenticated, redirecting to signin')
      return NextResponse.redirect(new URL('/auth/signin?callbackUrl=' + encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search), req.url))
    }
    
    // Only allow OWNER role to access owner page
    if (token?.role !== 'OWNER') {
      console.log('❌ Owner page - Not owner role, redirecting to home')
      return NextResponse.redirect(new URL('/', req.url))
    }
    
    console.log('✅ Owner page - Access granted')
  }

  console.log('✅ Middleware passed, allowing request')
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/bookings/:path*',
    '/auth/:path*',
    '/owner/:path*',
  ],
}
