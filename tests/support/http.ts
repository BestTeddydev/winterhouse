import { NextRequest } from 'next/server'

type Handler = (req: NextRequest, ctx: { params: any }) => Promise<Response>

interface CallOptions {
  body?: unknown
  query?: Record<string, string | number | undefined>
  params?: Record<string, string>
  headers?: Record<string, string>
  rawBody?: string
}

/** Invokes a route handler like Next.js would and returns status + parsed JSON */
export async function call(handler: Handler, method: string, options: CallOptions = {}) {
  const url = new URL('http://localhost/api/test')
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }
  const hasBody = options.body !== undefined || options.rawBody !== undefined
  const req = new NextRequest(url, {
    method,
    headers: { ...(hasBody && options.rawBody === undefined ? { 'content-type': 'application/json' } : {}), ...options.headers },
    body: options.rawBody ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
  })
  const res = await handler(req, { params: options.params ?? {} })
  const text = await res.text()
  return { status: res.status, body: text ? JSON.parse(text) : null }
}
