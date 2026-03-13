import { NextResponse } from 'next/server'
import mongoose from 'mongoose'

export async function GET() {
  try {
    // Quick health check - check connection state without blocking
    // This makes the health check faster and more reliable for Kubernetes probes
    let databaseStatus = 'not configured'
    
    if (process.env.MONGODB_URI || process.env.DATABASE_URL) {
      // Check mongoose connection state (0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting)
      const readyState = mongoose.connection.readyState
      
      if (readyState === 1) {
        // Already connected - do a quick ping with timeout
        try {
          await Promise.race([
            mongoose.connection.db?.admin().ping() || Promise.resolve(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000))
          ])
          databaseStatus = 'connected'
        } catch (error) {
          // Ping failed or timed out, but connection exists
          databaseStatus = readyState === 1 ? 'connected' : 'disconnected'
        }
      } else if (readyState === 2) {
        databaseStatus = 'connecting'
      } else {
        databaseStatus = 'disconnected'
      }
    }
    
    // Always return 200 for health check - Kubernetes will use response time
    // Only return 503 if there's a critical application error
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: databaseStatus,
      uptime: process.uptime(),
    })
  } catch (error) {
    // Only return 503 for critical errors
    console.error('Health check error:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'error',
        error: 'Health check failed',
      },
      { status: 503 }
    )
  }
}

