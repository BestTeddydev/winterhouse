// Test webhook endpoint for debugging
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== WEBHOOK TEST ===')
    console.log('Headers:', Object.fromEntries(request.headers.entries()))
    
    const body = await request.text()
    console.log('Body length:', body.length)
    console.log('Body preview:', body.substring(0, 200))
    
    const signature = request.headers.get('stripe-signature')
    console.log('Signature:', signature)
    
    return NextResponse.json({ 
      received: true, 
      bodyLength: body.length,
      hasSignature: !!signature,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test webhook error:', error)
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  }
}
