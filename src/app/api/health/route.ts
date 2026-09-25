import { NextResponse } from 'next/server'
import { isFirebaseConfigured } from '@/lib/firebase'

// Evaluate per request; otherwise Next.js renders this once at build time
export const dynamic = 'force-dynamic'

export async function GET() {
  // Firestore is connectionless, so the probe only reports configuration.
  // It deliberately does no reads: Kubernetes probes run every few seconds and reads are billed.
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: isFirebaseConfigured() ? 'firestore' : 'not configured',
    uptime: process.uptime(),
  })
}
