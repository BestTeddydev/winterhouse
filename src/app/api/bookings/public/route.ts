import { NextRequest, NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-auth'
import connectDB from '@/lib/db'
import Booking from '@/models/Booking'

// Always read live data; never pre-render at build time
export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    await connectDB()

    // Fetch only confirmed bookings - PENDING bookings don't count as booked until payment is completed
    const bookings = await Booking.find({
      status: { $in: ['CONFIRMED'] }
    }).select('roomId roomIds rooms checkIn checkOut status').lean()

    // Transform the data to match frontend expectations
    const transformedBookings = bookings.map(booking => ({
      ...booking,
      id: booking._id
    }))

    return NextResponse.json(transformedBookings)
  } catch (error) {
    return apiErrorResponse(error, 'ไม่สามารถดึงข้อมูลการจองได้')
  }
}

