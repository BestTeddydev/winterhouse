import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'

export async function GET() {
  try {
    // Only test database connection if MONGODB_URI is available
    let databaseStatus = 'not configured'
    
    if (process.env.MONGODB_URI) {
      try {
        await connectDB()
        databaseStatus = 'connected'
      } catch (error) {
        databaseStatus = 'disconnected'
        console.error('Database connection failed:', error)
      }
    }
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: databaseStatus,
      uptime: process.uptime(),
    })
  } catch (error) {
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

