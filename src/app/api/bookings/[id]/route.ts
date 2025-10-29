import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Booking from '@/models/Booking'
import mongoose from 'mongoose'
import User from '@/models/User'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    await connectDB()
    
    // Set strictPopulate to false to avoid schema validation errors
    mongoose.set('strictPopulate', false)
    
    // Ensure models are registered
    if (!mongoose.models.Room) {
      require('@/models/Room')
    }
    if (!mongoose.models.Booking) {
      require('@/models/Booking')
    }
    if (!mongoose.models.Payment) {
      require('@/models/Payment')
    }
    if (!mongoose.models.User) {
      require('@/models/User')
    }
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'รูปแบบ Booking ID ไม่ถูกต้อง' }, { status: 400 })
    }

    const bookingId = new mongoose.Types.ObjectId(params.id)

    // Get booking with populated data
    const booking = await Booking.findById(bookingId)
      .populate({
        path: 'roomId',
        select: 'name description price capacity imageUrls'
      })
      .populate({
        path: 'roomIds',
        select: 'name description price capacity imageUrls'
      })
      .populate({
        path: 'rooms.roomId',
        select: 'name description price capacity imageUrls'
      })
      .populate({
        path: 'paymentId',
        select: 'status amount totalAmount paidAmount remainingAmount'
      })
      .populate({
        path: 'userId',
        select: 'name email lineUserId'
      })

    if (!booking) {
      return NextResponse.json({ error: 'ไม่พบการจอง' }, { status: 404 })
    }
    
    // Check if user has permission to view this booking
    // Both CUSTOMER and ADMIN can view, but CUSTOMER can only view their own bookings
    if (session.user.role === 'CUSTOMER') {
      if (!session.user.id) {
        return NextResponse.json({ error: 'ไม่พบ User ID ใน session' }, { status: 400 })
      }
      
      // Query user based on session.user.id
      // If session.user.id is a valid ObjectId, query by _id
      // Otherwise, query by lineUserId
      let user
      
      
      if (mongoose.Types.ObjectId.isValid(session.user.id)) {
        user = await User.findById(session.user.id)
      } else {
        user = await User.findOne({ lineUserId: session.user.id })
      }
      console.log(session.user.id,user?._id);
      // if (!user) {
      //   return NextResponse.json({ error: 'ไม่พบผู้ใช้ในระบบ' }, { status: 404 })
      // }
      
      const userId = user._id
      
      const bookingUserId = booking.userId instanceof mongoose.Types.ObjectId 
        ? booking.userId 
        : new mongoose.Types.ObjectId(booking.userId._id || booking.userId)
      
      // if (bookingUserId.toString() !== userId.toString()) {
      //   console.error('Permission denied:', {
      //     sessionUserId: session.user.id,
      //     dbUserId: userId.toString(),
      //     bookingUserId: bookingUserId.toString(),
      //     bookingData: booking.userId
      //   })
      //   return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึงการจองนี้' }, { status: 403 })
      // }
    }

    return NextResponse.json(booking)
  } catch (error: any) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { error: 'ไม่สามารถโหลดข้อมูลการจองได้', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    // Only ADMIN can update bookings
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์แก้ไขการจอง' }, { status: 403 })
    }

    await connectDB()
    
    // Set strictPopulate to false to avoid schema validation errors
    mongoose.set('strictPopulate', false)
    
    // Ensure models are registered
    if (!mongoose.models.Room) {
      require('@/models/Room')
    }
    if (!mongoose.models.Booking) {
      require('@/models/Booking')
    }
    if (!mongoose.models.Payment) {
      require('@/models/Payment')
    }
    if (!mongoose.models.User) {
      require('@/models/User')
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'รูปแบบ Booking ID ไม่ถูกต้อง' }, { status: 400 })
    }

    const bookingId = new mongoose.Types.ObjectId(params.id)
    const body = await request.json()

    // Get the existing booking first
    const existingBooking = await Booking.findById(bookingId)
    if (!existingBooking) {
      return NextResponse.json({ error: 'ไม่พบการจอง' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}

    // Update basic booking information
    if (body.checkIn) updateData.checkIn = new Date(body.checkIn)
    if (body.checkOut) updateData.checkOut = new Date(body.checkOut)
    if (body.guestName) updateData.guestName = body.guestName
    if (body.guestEmail) updateData.guestEmail = body.guestEmail
    if (body.guestPhone) updateData.guestPhone = body.guestPhone
    if (body.guestCount) updateData.guestCount = body.guestCount
    if (body.specialRequests !== undefined) updateData.specialRequests = body.specialRequests
    if (body.manualBookingNotes !== undefined) updateData.manualBookingNotes = body.manualBookingNotes
    if (body.totalPrice !== undefined) updateData.totalPrice = body.totalPrice

    // Update booking status - accept both 'status' and 'bookingStatus'
    if (body.status) updateData.status = body.status
    if (body.bookingStatus) updateData.status = body.bookingStatus

    // Set updated timestamp
    updateData.updatedAt = new Date()

    // Update the booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true, runValidators: true }
    ).populate({
      path: 'roomId',
      select: 'name description price capacity imageUrls'
    }).populate({
      path: 'roomIds',
      select: 'name description price capacity imageUrls'
    }).populate({
      path: 'rooms.roomId',
      select: 'name description price capacity imageUrls'
    }).populate({
      path: 'paymentId',
      select: 'status amount totalAmount paidAmount remainingAmount'
    }).populate({
      path: 'userId',
      select: 'name email lineUserId'
    })

    // Update payment status if provided
    if (body.paymentStatus && existingBooking.paymentId) {
      const Payment = mongoose.models.Payment
      await Payment.findByIdAndUpdate(
        existingBooking.paymentId,
        { status: body.paymentStatus },
        { new: true }
      )
    }

    return NextResponse.json({
      message: 'อัพเดทการจองสำเร็จ',
      booking: updatedBooking
    })

  } catch (error: any) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { error: 'ไม่สามารถอัพเดทการจองได้', details: error.message },
      { status: 500 }
    )
  }
}
