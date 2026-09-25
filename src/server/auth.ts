import { getServerSession, Session } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/db'
import { isValidId } from '@/lib/odm'
import User from '@/models/User'
import { forbidden, unauthorized } from './errors'

export type Role = Session['user']['role']

export const STAFF_ROLES: Role[] = ['ADMIN', 'OWNER']

export function isStaff(session: Session | null): boolean {
  return !!session && STAFF_ROLES.includes(session.user.role)
}

/** The session if signed in (for public routes that show more to staff) */
export function getOptionalSession(): Promise<Session | null> {
  return getServerSession(authOptions)
}

/** Returns the session, or throws 401/403 when not signed in or the role is not allowed */
export async function requireSession(...roles: Role[]): Promise<Session> {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw unauthorized()
  if (roles.length > 0 && !roles.includes(session.user.role)) throw forbidden()
  return session
}

/** The user document of the session. Old sessions may carry the LINE user id instead of the document id. */
export async function findSessionUser(session: Session) {
  await connectDB()
  const { id } = session.user
  return isValidId(id) ? User.findById(id) : User.findOne({ lineUserId: id })
}

/** Throws 403 unless the session is staff or owns the resource */
export async function assertOwnerOrStaff(session: Session, ownerId: unknown, message = 'ไม่มีสิทธิ์เข้าถึงการจองนี้') {
  if (isStaff(session)) return
  const user = await findSessionUser(session)
  const id = (ownerId as { _id?: unknown } | null)?._id ?? ownerId
  if (!user || String(id) !== user._id) throw forbidden(message)
}
