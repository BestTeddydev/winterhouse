'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const STAFF_ROLES = ['ADMIN', 'OWNER']

/** Whether the user is ADMIN/OWNER; others are sent to `redirectTo` */
export function useIsStaff(redirectTo = '/auth/signin') {
  const { data: session, status } = useSession()
  const router = useRouter()
  const staff = STAFF_ROLES.includes(session?.user?.role ?? '')
  useEffect(() => {
    if (status !== 'loading' && !staff) router.push(redirectTo)
  }, [status, staff, router, redirectTo])
  return { status, staff }
}
