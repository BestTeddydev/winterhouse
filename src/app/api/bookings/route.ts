import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Booking from '@/models/Booking'
import { sendLineNotification, formatBookingNotification } from '@/lib/line'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    await connectDB()
    let query: any = {}

    if (session.user.role === 'CUSTOMER') {
      query.userId = new mongoose.Types.ObjectId(session.user.id)
    } else if (userId) {
      query.userId = new mongoose.Types.ObjectId(userId)
    }

    const bookings = await Booking.find(query)
      .populate('room')
      .populate('payment')
      .populate('user', 'name email lineUserId')
      .sort({ createdAt: -1 })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      roomId,
      checkIn,
      checkOut,
      totalPrice,
      guestName,
      guestEmail,
      guestPhone,
      specialRequests,
    } = body

    await connectDB()

    // Check availability
    const existingBookings = await Booking.find({
      roomId: new mongoose.Types.ObjectId(roomId),
      status: { $in: ['PENDING', 'CONFIRMED'] },
      $or: [
        {
          checkIn: { $gte: new Date(checkIn), $lte: new Date(checkOut) }
        },
        {
          checkOut: { $gte: new Date(checkIn), $lte: new Date(checkOut) }
        },
        {
          $and: [
            { checkIn: { $lte: new Date(checkIn) } },
            { checkOut: { $gte: new Date(checkOut) } }
          ]
        }
      ]
    })

    if (existingBookings.length > 0) {
      return NextResponse.json(
        { error: 'Room is not available for selected dates' },
        { status: 400 }
      )
    }

    // Create booking
    const booking = new Booking({
      roomId: new mongoose.Types.ObjectId(roomId),
      userId: new mongoose.Types.ObjectId(session.user.id),
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      totalPrice,
      guestName,
      guestEmail,
      guestPhone,
      specialRequests,
    })

    await booking.save()

    // Populate for response
    await booking.populate('room')
    await booking.populate('user', 'lineUserId')

    // Create payment record
    const { default: Payment } = await import('@/models/Payment')
    const payment = new Payment({
      bookingId: booking._id,
      amount: totalPrice,
    })
    await payment.save()

    // Send notification to admin
    if (process.env.LINE_ADMIN_USER_ID) {
      try {
        await sendLineNotification({
          userId: process.env.LINE_ADMIN_USER_ID,
          message: formatBookingNotification(booking),
        })
      } catch (error) {
        console.error('Failed to send admin notification:', error)
      }
    }

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }
}

