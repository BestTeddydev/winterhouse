import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Booking from '@/models/Booking'
import { sendLineNotification, formatBookingStatusUpdate } from '@/lib/line'
import mongoose from 'mongoose'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const booking = await Booking.findById(params.id)
      .populate('room')
      .populate('payment')
      .populate('user', 'name email lineUserId')

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check authorization
    if (session.user.role !== 'ADMIN' && booking.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body

    await connectDB()

    // Get current booking
    const currentBooking = await Booking.findById(params.id)
      .populate('room')
      .populate('user', 'lineUserId')

    if (!currentBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const oldStatus = currentBooking.status

    // Update booking
    const booking = await Booking.findByIdAndUpdate(
      params.id,
      { status },
      { new: true }
    ).populate('room').populate('user', 'lineUserId')

    // Send notification to customer if status changed
    if (oldStatus !== status && booking.user.lineUserId) {
      try {
        await sendLineNotification({
          userId: booking.user.lineUserId,
          message: formatBookingStatusUpdate(booking, oldStatus),
        })
      } catch (error) {
        console.error('Failed to send customer notification:', error)
      }
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const booking = await Booking.findById(params.id)

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check authorization
    if (session.user.role !== 'ADMIN' && booking.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await Booking.findByIdAndDelete(params.id)

    return NextResponse.json({ message: 'Booking deleted successfully' })
  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 })
  }
}