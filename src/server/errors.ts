import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { CastError, ValidationError } from '@/lib/odm'

/**
 * An error with an HTTP status whose message is safe to show to the user.
 * `extra` fields are added to the JSON body next to `error`.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly extra?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const badRequest = (message: string, extra?: Record<string, unknown>) => new ApiError(400, message, extra)
export const unauthorized = (message = 'ไม่ได้รับอนุญาต') => new ApiError(401, message)
export const forbidden = (message = 'ไม่มีสิทธิ์เข้าถึง') => new ApiError(403, message)
export const notFound = (message: string) => new ApiError(404, message)
export const conflict = (message: string) => new ApiError(409, message)

/**
 * Maps known errors to 4xx JSON responses ({ error, details? }). Anything else is logged and
 * returned as 500 with the given message, so internal details never reach the client.
 */
export function errorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message, ...error.extra }, { status: error.status })
  }
  if (error instanceof ZodError) {
    const issues = error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
    return NextResponse.json({ error: issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง', details: issues }, { status: 400 })
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
