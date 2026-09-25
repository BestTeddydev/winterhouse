import { getServerSession, Session } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from './auth'
import connectDB from './db'
import { CastError, ValidationError, isValidId } from './odm'
import User from '@/models/User'

export type Role = Session['user']['role']

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

// Returns the session, or throws ApiError(401/403) when not signed in or the role is not allowed
export async function requireSession(...roles: Role[]): Promise<Session> {
  const session = await getServerSession(authOptions)
  if (!session) throw new ApiError(401, 'ไม่ได้รับอนุญาต')
  if (roles.length > 0 && !roles.includes(session.user.role)) throw new ApiError(403, 'ไม่มีสิทธิ์เข้าถึง')
  return session
}

// session.user.id is the user document id; sessions created before sign-in stored it may carry the LINE user id
export async function findSessionUser(session: Session) {
  await connectDB()
  const { id } = session.user
  return isValidId(id) ? User.findById(id) : User.findOne({ lineUserId: id })
}

export function isStaff(session: Session) {
  return session.user.role === 'ADMIN' || session.user.role === 'OWNER'
}

// Maps known errors to 4xx responses; anything else is logged and returned as 500 with the given message
export function apiErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  if (error instanceof CastError) {
    return NextResponse.json({ error: `รูปแบบ ID ไม่ถูกต้อง: ${error.path}` }, { status: 400 })
  }
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { error: 'ข้อมูลไม่ถูกต้อง', details: Object.values(error.errors).map((e) => e.message) },
      { status: 400 }
    )
  }
  console.error(fallbackMessage, error)
  return NextResponse.json({ error: fallbackMessage }, { status: 500 })
}
