import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Booking from '@/models/Booking'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    await connectDB()
    const bookings = await Booking.find({
      roomId: params.id,
      status: { $in: ['PENDING', 'CONFIRMED'] },
      $or: [
        {
          checkIn: { $gte: new Date(startDate), $lte: new Date(endDate) }
        },
        {
          checkOut: { $gte: new Date(startDate), $lte: new Date(endDate) }
        },
        {
          $and: [
            { checkIn: { $lte: new Date(startDate) } },
            { checkOut: { $gte: new Date(endDate) } }
          ]
        }
      ]
    }).select('checkIn checkOut')

    return NextResponse.json({
      available: bookings.length === 0,
      bookings,
    })
  } catch (error) {
    console.error('Error checking availability:', error)
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    )
  }
}

