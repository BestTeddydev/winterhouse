'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type Role = 'ADMIN' | 'OWNER' | 'EMPLOYEE' | 'CUSTOMER'

const STAFF_ROLES: Role[] = ['ADMIN', 'OWNER']

/**
 * Whether the signed-in user has one of `roles`. Signed-out users are sent to `signedOutTo`,
 * users with another role to `otherRoleTo`. The middleware already guards /admin; this covers
 * pages that need a narrower role than their section (e.g. ADMIN-only pages under /admin).
 */
export function useRequireRole(roles: Role[], { signedOutTo = '/auth/signin', otherRoleTo = '/' } = {}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const allowed = roles.includes(session?.user?.role as Role)
  useEffect(() => {
    if (status === 'unauthenticated') router.push(signedOutTo)
    else if (status === 'authenticated' && !allowed) router.push(otherRoleTo)
  }, [status, allowed, router, signedOutTo, otherRoleTo])
  return { status, allowed }
}

/**
 * Whether the user is ADMIN/OWNER (both manage everything under /admin except user accounts).
 * Signed-out users go to sign-in, other roles to the home page unless `redirectTo` is given.
 */
export function useIsStaff(redirectTo?: string) {
  const { status, allowed } = useRequireRole(STAFF_ROLES, redirectTo ? { signedOutTo: redirectTo, otherRoleTo: redirectTo } : {})
  return { status, staff: allowed }
}
