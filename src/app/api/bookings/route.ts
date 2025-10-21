import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Booking from '@/models/Booking'
import Room from '@/models/Room'
import Payment from '@/models/Payment'
import { sendLineNotification, formatBookingNotification } from '@/lib/line'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

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

    let query: any = {}

    if (session.user.role === 'CUSTOMER') {
      // Validate session.user.id before creating ObjectId
      if (!session.user.id) {
        return NextResponse.json({ error: 'ไม่พบ User ID ใน session' }, { status: 400 })
      }
      
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(session.user.id)) {
        return NextResponse.json({ error: 'รูปแบบ User ID ไม่ถูกต้อง' }, { status: 400 })
      }
      
      query.userId = new mongoose.Types.ObjectId(session.user.id)
    } else if (userId) {
      // Validate userId from query params
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return NextResponse.json({ error: 'รูปแบบ userId ไม่ถูกต้อง' }, { status: 400 })
      }
      
      query.userId = new mongoose.Types.ObjectId(userId)
    }

    const bookings = await Booking.find(query)
      .populate({
        path: 'roomId',
        model: 'Room',
        select: 'name description price capacity imageUrls'
      })
      .populate({
        path: 'paymentId',
        model: 'Payment',
        select: 'status amount'
      })
      .populate({
        path: 'userId',
        model: 'User',
        select: 'name email lineUserId'
      })
      .sort({ createdAt: -1 })


    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Error fetching bookings:', error)
    
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
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
      paymentType = 'FULL', // Default to full payment
    } = body

    // Validate required fields
    if (!roomId) {
      return NextResponse.json({ error: 'ต้องระบุ Room ID' }, { status: 400 })
    }
    
    if (!checkIn || !checkOut) {
      return NextResponse.json({ error: 'ต้องระบุวันเช็คอินและเช็คเอาท์' }, { status: 400 })
    }
    
    if (!guestName || !guestEmail || !guestPhone) {
      return NextResponse.json({ error: 'ต้องระบุข้อมูลผู้เข้าพัก' }, { status: 400 })
    }
    
    if (!totalPrice || totalPrice <= 0) {
      return NextResponse.json({ error: 'ต้องระบุราคารวมที่ถูกต้อง' }, { status: 400 })
    }

    // Validate payment type
    if (!['FULL', 'PARTIAL'].includes(paymentType)) {
      return NextResponse.json({ error: 'ประเภทการชำระเงินไม่ถูกต้อง' }, { status: 400 })
    }

    // Validate ObjectId formats
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return NextResponse.json({ error: 'รูปแบบ Room ID ไม่ถูกต้อง' }, { status: 400 })
    }
    
    if (!session.user.id || !mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ error: 'รูปแบบ User ID ไม่ถูกต้อง' }, { status: 400 })
    }

    // Validate dates
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return NextResponse.json({ error: 'รูปแบบวันที่ไม่ถูกต้อง' }, { status: 400 })
    }
    
    if (checkInDate >= checkOutDate) {
      return NextResponse.json({ error: 'วันเช็คเอาท์ต้องมากกว่าวันเช็คอิน' }, { status: 400 })
    }
    
    if (checkInDate < new Date()) {
      return NextResponse.json({ error: 'วันเช็คอินไม่สามารถเป็นวันในอดีตได้' }, { status: 400 })
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

    // Check availability
    // Allow check-in on the same day as previous guest's check-out
    // But prevent check-in on the same day as previous guest's check-in
    const existingBookings = await Booking.find({
      roomId: new mongoose.Types.ObjectId(roomId),
      status: { $in: ['PENDING', 'CONFIRMED'] },
      $or: [
        {
          // Prevent if new check-in overlaps with existing booking period
          $and: [
            { checkIn: { $lt: checkOutDate } }, // Existing check-in is before new check-out
            { checkOut: { $gt: checkInDate } }  // Existing check-out is after new check-in
          ]
        }
      ]
    })

    if (existingBookings.length > 0) {
      return NextResponse.json(
        { error: 'ห้องพักไม่ว่างในวันที่เลือก' },
        { status: 400 }
      )
    }

    // Create booking
    const booking = new Booking({
      roomId: new mongoose.Types.ObjectId(roomId),
      userId: new mongoose.Types.ObjectId(session.user.id),
      checkIn: checkInDate,
      checkOut: checkOutDate,
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
    
    // Calculate payment amounts based on payment type
    let paymentAmount: number
    let paidAmount: number
    let remainingAmount: number
    
    if (paymentType === 'FULL') {
      paymentAmount = totalPrice
      paidAmount = totalPrice
      remainingAmount = 0
    } else { // PARTIAL
      paymentAmount = Math.round(totalPrice * 0.5) // 50% down payment
      paidAmount = paymentAmount
      remainingAmount = totalPrice - paymentAmount
    }
    
    const payment = new Payment({
      bookingId: booking._id,
      amount: paymentAmount,
      totalAmount: totalPrice,
      paidAmount: paidAmount,
      remainingAmount: remainingAmount,
      paymentType: paymentType,
    })
    await payment.save()

    // Update booking with payment ID
    booking.paymentId = payment._id
    await booking.save()

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
    
    return NextResponse.json({ error: 'ไม่สามารถสร้างการจองได้' }, { status: 500 })
  }
}

