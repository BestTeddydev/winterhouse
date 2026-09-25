import { NextRequest, NextResponse } from 'next/server'
import type { Session } from 'next-auth'
import { z } from 'zod'
import connectDB from '@/lib/db'
import { Role, requireSession } from './auth'
import { badRequest, errorResponse, notFound } from './errors'

type Access = 'public' | 'authenticated' | Role[]

interface RouteContext<P, B, Q> {
  req: NextRequest
  params: P
  body: B
  query: Q
  session: Session
}

interface RouteOptions<B extends z.ZodTypeAny | undefined, Q extends z.ZodTypeAny | undefined> {
  /** Who may call the route: anyone, any signed-in user, or specific roles */
  access: Access
  body?: B
  query?: Q
  /** Message returned with 500 for unexpected errors */
  errorMessage: string
}

type Infer<S> = S extends z.ZodTypeAny ? z.infer<S> : undefined

/**
 * Wraps a route handler with the cross-cutting concerns every API route needs:
 * authentication/authorization, zod validation of the JSON body and query string,
 * a database connection and uniform error responses. A handler returns either a
 * Response or plain data (sent as 200 JSON).
 */
export function apiRoute<
  P = Record<string, string>,
  B extends z.ZodTypeAny | undefined = undefined,
  Q extends z.ZodTypeAny | undefined = undefined,
>(
  options: RouteOptions<B, Q>,
  handler: (ctx: RouteContext<P, Infer<B>, Infer<Q>>) => PromiseLike<unknown>
) {
  return async (req: NextRequest, context: { params: P }) => {
    try {
      const session =
        options.access === 'public'
          ? (null as unknown as Session)
          : await requireSession(...(options.access === 'authenticated' ? [] : options.access))

      let body = undefined as Infer<B>
      if (options.body) {
        const json = await req.json().catch(() => {
          throw badRequest('รูปแบบข้อมูลไม่ถูกต้อง (JSON)')
        })
        body = options.body.parse(json)
      }

      const query = (options.query ? options.query.parse(Object.fromEntries(req.nextUrl.searchParams)) : undefined) as Infer<Q>

      await connectDB()
      const result = await handler({ req, params: context?.params ?? ({} as P), body, query, session })
      return result instanceof Response ? result : NextResponse.json(result ?? null)
    } catch (error) {
      return errorResponse(error, options.errorMessage)
    }
  }
}

export const created = (data: unknown) => NextResponse.json(data, { status: 201 })

/** Loads a document by id or throws 404 */
export async function findOr404<T>(query: PromiseLike<T | null>, message: string): Promise<T> {
  const doc = await query
  if (!doc) throw notFound(message)
  return doc
}
