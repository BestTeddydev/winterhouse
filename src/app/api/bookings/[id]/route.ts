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
    if (!mongoose.models.User) {
      require('@/models/User')
    }
    if (!mongoose.models.Payment) {
      require('@/models/Payment')
    }

    const booking = await Booking.findById(params.id)
      .populate({
        path: 'roomId',
        model: 'Room',
        select: 'name description price capacity imageUrls'
      })
      .populate({
        path: 'paymentId',
        model: 'Payment',
        select: 'status amount totalAmount paidAmount remainingAmount'
      })
      .populate({
        path: 'userId',
        model: 'User',
        select: 'name email lineUserId'
      })

    if (!booking) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการจอง' }, { status: 404 })
    }

    // Check authorization
    if (session.user.role !== 'ADMIN' && booking.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    // Transform the data to match frontend expectations
    const bookingObj = booking.toObject()
    const transformedBooking = {
      ...bookingObj,
      id: bookingObj._id, // Ensure id is properly set
      room: booking.roomId,
      payment: booking.paymentId || { status: 'PENDING', amount: 0 }
    }

    return NextResponse.json(transformedBooking)
  } catch (error) {
    console.error('Error fetching booking:', error)
    
    // Handle specific error types
    if (error instanceof mongoose.Error.CastError) {
      return NextResponse.json({ 
        error: `รูปแบบ ID ไม่ถูกต้อง: ${error.path}` 
      }, { status: 400 })
    }
    
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({ 
        error: 'ข้อมูลไม่ถูกต้อง', 
        details: Object.values(error.errors).map(err => err.message)
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลการจองได้' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      status, 
      checkIn, 
      checkOut, 
      guestName, 
      guestEmail, 
      guestPhone, 
      guestCount,
      specialRequests,
      manualBookingNotes,
      totalPrice,
      paymentStatus
    } = body

    console.log('Updating booking:', params.id, 'with data:', body)

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
    if (!mongoose.models.User) {
      require('@/models/User')
    }
    if (!mongoose.models.Payment) {
      require('@/models/Payment')
    }

    // Get current booking
    const currentBooking = await Booking.findById(params.id)
      .populate('roomId')
      .populate('userId', 'lineUserId')
      .populate('paymentId')

    if (!currentBooking) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการจอง' }, { status: 404 })
    }

    const oldStatus = currentBooking.status

    // Prepare update data
    const updateData: any = {}
    
    if (status !== undefined) updateData.status = status
    if (checkIn !== undefined) updateData.checkIn = new Date(checkIn)
    if (checkOut !== undefined) updateData.checkOut = new Date(checkOut)
    if (guestName !== undefined) updateData.guestName = guestName
    if (guestEmail !== undefined) updateData.guestEmail = guestEmail
    if (guestPhone !== undefined) updateData.guestPhone = guestPhone
    if (guestCount !== undefined) updateData.guestCount = guestCount
    if (specialRequests !== undefined) updateData.specialRequests = specialRequests
    if (manualBookingNotes !== undefined) updateData.manualBookingNotes = manualBookingNotes
    if (totalPrice !== undefined) updateData.totalPrice = totalPrice

    console.log('Update data:', updateData)

    // Update booking
    const booking = await Booking.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    ).populate('roomId', 'name description price capacity imageUrls').populate('userId', 'lineUserId').populate('paymentId', 'status amount totalAmount paidAmount remainingAmount')

    if (!booking) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการจอง' }, { status: 404 })
    }

    console.log('Updated booking:', booking)

    // Update payment status if provided
    if (paymentStatus !== undefined && booking.paymentId) {
      const { default: Payment } = await import('@/models/Payment')
      await Payment.findByIdAndUpdate(
        booking.paymentId._id || booking.paymentId,
        { status: paymentStatus },
        { new: true }
      )
    }

    // Send notification to customer if status changed
    if (oldStatus !== status && booking.userId?.lineUserId) {
      try {
        await sendLineNotification({
          userId: booking.userId.lineUserId,
          message: formatBookingStatusUpdate(booking, oldStatus),
        })
      } catch (error) {
        console.error('Failed to send customer notification:', error)
        // Don't fail the request if notification fails
      }
    }

    // Transform the data to match frontend expectations
    const bookingObj = booking.toObject()
    const transformedBooking = {
      ...bookingObj,
      id: bookingObj._id, // Ensure id is properly set
      room: booking.roomId,
      payment: booking.paymentId || { status: 'PENDING', amount: 0 }
    }

    console.log('Returning transformed booking:', transformedBooking)
    return NextResponse.json(transformedBooking)
  } catch (error) {
    console.error('Error updating booking:', error)
    
    // Handle specific error types
    if (error instanceof mongoose.Error.CastError) {
      return NextResponse.json({ 
        error: `รูปแบบ ID ไม่ถูกต้อง: ${error.path}` 
      }, { status: 400 })
    }
    
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({ 
        error: 'ข้อมูลไม่ถูกต้อง', 
        details: Object.values(error.errors).map(err => err.message)
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'ไม่สามารถอัปเดตการจองได้' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    await connectDB()
    const booking = await Booking.findById(params.id)

    if (!booking) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการจอง' }, { status: 404 })
    }

    // Check authorization
    if (session.user.role !== 'ADMIN' && booking.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    await Booking.findByIdAndDelete(params.id)

    return NextResponse.json({ message: 'ลบการจองสำเร็จ' })
  } catch (error) {
    console.error('Error deleting booking:', error)
    
    // Handle specific error types
    if (error instanceof mongoose.Error.CastError) {
      return NextResponse.json({ 
        error: `รูปแบบ ID ไม่ถูกต้อง: ${error.path}` 
      }, { status: 400 })
    }
    
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({ 
        error: 'ข้อมูลไม่ถูกต้อง', 
        details: Object.values(error.errors).map(err => err.message)
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'ไม่สามารถลบการจองได้' }, { status: 500 })
  }
}