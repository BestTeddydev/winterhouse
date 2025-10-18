// Enhanced webhook test endpoint
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== ENHANCED WEBHOOK TEST ===')
    
    // Test different ways to get the body
    const arrayBuffer = await request.arrayBuffer()
    const bodyString = Buffer.from(arrayBuffer).toString('utf-8')
    const textBody = await request.text()
    
    console.log('ArrayBuffer length:', arrayBuffer.byteLength)
    console.log('BodyString length:', bodyString.length)
    console.log('TextBody length:', textBody.length)
    console.log('Bodies match:', bodyString === textBody)
    
    const signature = request.headers.get('stripe-signature')
    console.log('Signature:', signature)
    console.log('All headers:', Object.fromEntries(request.headers.entries()))
    
    console.log('BodyString preview:', bodyString.substring(0, 200))
    console.log('TextBody preview:', textBody.substring(0, 200))
    
    return NextResponse.json({ 
      received: true,
      arrayBufferLength: arrayBuffer.byteLength,
      bodyStringLength: bodyString.length,
      textBodyLength: textBody.length,
      bodiesMatch: bodyString === textBody,
      hasSignature: !!signature,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Enhanced test webhook error:', error)
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  }
}
