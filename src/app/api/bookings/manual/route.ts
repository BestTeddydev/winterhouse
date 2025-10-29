import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Booking from '@/models/Booking'
import Payment from '@/models/Payment'
import mongoose from 'mongoose'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'ต้องเป็นแอดมินเท่านั้น' }, { status: 403 })
    }

    const body = await request.json()
    console.log('Received booking data:', body) // Debug log
    
    const {
      roomId,
      checkIn,
      checkOut,
      guestName,
      guestEmail,
      guestPhone,
      guestCount = 1,
      specialRequests,
      paymentType = 'FULL',
      paymentStatus = 'COMPLETED',
      totalPrice,
      notes,
      isManualBooking = true,
      createdBy
    } = body

    // Validate required fields
    console.log('Validating roomId:', roomId) // Debug log
    if (!roomId) {
      return NextResponse.json({ error: 'ต้องระบุ Room ID' }, { status: 400 })
    }
    
    if (!checkIn || !checkOut) {
      return NextResponse.json({ error: 'ต้องระบุวันเช็คอินและเช็คเอาท์' }, { status: 400 })
    }
    
    if (!guestName) {
      return NextResponse.json({ error: 'ต้องระบุชื่อผู้เข้าพัก' }, { status: 400 })
    }
    
    if (!totalPrice || totalPrice <= 0) {
      return NextResponse.json({ error: 'ต้องระบุราคารวมที่ถูกต้อง' }, { status: 400 })
    }

    // Validate ObjectId formats
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return NextResponse.json({ error: 'รูปแบบ Room ID ไม่ถูกต้อง' }, { status: 400 })
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

    // Check availability (only if not manual override)
    if (!body.overrideAvailability) {
      const existingBookings = await Booking.find({
        roomId: new mongoose.Types.ObjectId(roomId),
        status: { $in: ['CONFIRMED'] }, // Only check against confirmed bookings
        $or: [
          {
            $and: [
              { checkIn: { $lt: checkOutDate } },
              { checkOut: { $gt: checkInDate } }
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
    }

    // Create booking with manual booking flag
    // Manual bookings are always CONFIRMED because customer has already paid deposit
    const booking = new Booking({
      roomId: new mongoose.Types.ObjectId(roomId),
      userId: new mongoose.Types.ObjectId(createdBy || session.user.id), // Use admin as user
      checkIn: checkInDate,
      checkOut: checkOutDate,
      totalPrice,
      status: 'CONFIRMED', // Manual bookings are always confirmed since customer already paid deposit
      guestName,
      guestEmail,
      guestPhone,
      specialRequests,
      guestCount,
      isManualBooking: true,
      manualBookingNotes: notes,
      createdBy: new mongoose.Types.ObjectId(session.user.id)
    })

    await booking.save()

    // Create payment record
    let paymentAmount: number
    let paidAmount: number
    let remainingAmount: number
    
    if (paymentType === 'FULL') {
      paymentAmount = totalPrice
      paidAmount = paymentStatus === 'COMPLETED' ? totalPrice : 0
      remainingAmount = 0
    } else { // PARTIAL
      paymentAmount = Math.round(totalPrice * 0.5) // 50% down payment
      paidAmount = paymentStatus === 'COMPLETED' ? paymentAmount : 0
      remainingAmount = totalPrice - paymentAmount
    }
    
    const payment = new Payment({
      bookingId: booking._id,
      amount: paymentAmount,
      totalAmount: totalPrice,
      paidAmount: paidAmount,
      remainingAmount: remainingAmount,
      paymentType: paymentType,
      status: paymentStatus,
      isManualPayment: true,
      manualPaymentNotes: notes
    })
    await payment.save()

    // Update booking with payment ID
    booking.paymentId = payment._id
    await booking.save()

    // Populate for response
    await booking.populate('roomId', 'name description price capacity imageUrls')
    await booking.populate('paymentId', 'status amount totalAmount paidAmount remainingAmount')

    // Transform the data to match frontend expectations
    const bookingObj = booking.toObject()
    const transformedBooking = {
      ...bookingObj,
      id: bookingObj._id, // Ensure id is properly set
      room: booking.roomId,
      payment: booking.paymentId || { status: 'PENDING', amount: 0 }
    }

    return NextResponse.json({
      ...transformedBooking,
      message: 'สร้างการจองด้วยตนเองสำเร็จ'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating manual booking:', error)
    
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
