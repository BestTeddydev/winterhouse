import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Booking from '@/models/Booking'
import Room from '@/models/Room'
import User from '@/models/User'
import Payment from '@/models/Payment'
import { sendLineNotification, formatBookingNotification } from '@/lib/line'
import { calculateMultipleRoomsPrice, calculateRoomPriceRange } from '@/lib/pricing'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'checkIn' // Default sort by checkIn
    const sortOrder = searchParams.get('sortOrder') || 'asc' // Default ascending

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
    if (!mongoose.models.User) {
      require('@/models/User')
    }

    let query: any = {}
    
    if (session.user.role === 'CUSTOMER') {
      // Query user based on session.user.id
      // If session.user.id is a valid ObjectId, query by _id
      // Otherwise, query by lineUserId
      let user
      if (mongoose.Types.ObjectId.isValid(session.user.id)) {
        user = await User.findById(session.user.id)
      } else {
        user = await User.findOne({ lineUserId: session.user.id })
      }
      
      if (!user) {
        return NextResponse.json({ error: 'ไม่พบผู้ใช้ในระบบ' }, { status: 404 })
      }
      
      query.userId = user._id
    } else if (userId) {
      // Validate userId from query params
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return NextResponse.json({ error: 'รูปแบบ userId ไม่ถูกต้อง' }, { status: 400 })
      }
      
      query.userId = new mongoose.Types.ObjectId(userId)
    }

    // Build sort object
    const sortObject: any = {}
    if (sortBy === 'checkIn') {
      sortObject.checkIn = sortOrder === 'desc' ? -1 : 1
    } else if (sortBy === 'createdAt') {
      sortObject.createdAt = sortOrder === 'desc' ? -1 : 1
    } else if (sortBy === 'totalPrice') {
      sortObject.totalPrice = sortOrder === 'desc' ? -1 : 1
    } else {
      sortObject.checkIn = 1 // Default to checkIn ascending
    }

    // Get total count for pagination
    const totalBookings = await Booking.countDocuments(query)

    // Calculate pagination
    const skip = (page - 1) * limit
    const totalPages = Math.ceil(totalBookings / limit)

    const bookings = await Booking.find(query)
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
      .sort(sortObject)
      .skip(skip)
      .limit(limit)

    // Transform the data to match frontend expectations
    const transformedBookings = bookings.map(booking => {
      const bookingObj = booking.toObject()
      return {
        ...bookingObj,
        id: bookingObj._id, // Ensure id is properly set
        room: booking.roomId,
        payment: booking.paymentId || { status: 'PENDING', amount: 0 }
      }
    })

    return NextResponse.json({
      bookings: transformedBookings,
      pagination: {
        page,
        limit,
        total: totalBookings,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    })
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
      roomIds, // สำหรับจองหลายห้อง
      checkIn,
      checkOut,
      totalPrice,
      guestName,
      guestEmail,
      guestPhone,
      specialRequests,
      paymentType = 'FULL', // Default to full payment
      discount,
      discountAmount,
      bookingStatus,
      isManualBooking = false,
    } = body

    // Handle discount values - use nullish coalescing to allow 0 values
    const finalDiscount = discount !== undefined && discount !== null ? Number(discount) : 0
    const finalDiscountAmount = discountAmount !== undefined && discountAmount !== null ? Number(discountAmount) : 0
    
    // Ensure values are valid numbers and within bounds
    const validDiscount = Math.max(0, Math.min(100, Number.isNaN(finalDiscount) ? 0 : finalDiscount))
    const validDiscountAmount = Math.max(0, Number.isNaN(finalDiscountAmount) ? 0 : finalDiscountAmount)
    
    console.log('Discount values received:', { 
      original: { discount, discountAmount },
      processed: { discount: validDiscount, discountAmount: validDiscountAmount }
    })

    // Validate required fields
    // Support both single roomId and multiple roomIds
    let selectedRoomIds: string[] = []
    
    if (roomIds && Array.isArray(roomIds) && roomIds.length > 0) {
      // Filter out null, undefined, and empty strings
      selectedRoomIds = roomIds.filter(id => id && id.trim() !== '' && id !== 'null')
    } else if (roomId && roomId !== 'null') {
      selectedRoomIds = [roomId]
    }
    
    if (selectedRoomIds.length === 0) {
      return NextResponse.json({ error: 'ต้องระบุ Room ID หรือ Room IDs' }, { status: 400 })
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
    for (const id of selectedRoomIds) {
      if (!id || typeof id !== 'string') {
        return NextResponse.json({ error: `Room ID ไม่ถูกต้อง: ${id}` }, { status: 400 })
      }
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ error: `รูปแบบ Room ID ไม่ถูกต้อง: ${id}` }, { status: 400 })
      }
    }
    
    // if (!session.user.id || !mongoose.Types.ObjectId.isValid(session.user.id)) {
    //   return NextResponse.json({ error: 'รูปแบบ User ID ไม่ถูกต้อง' }, { status: 400 })
    // }

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
    let user
    if (mongoose.Types.ObjectId.isValid(session.user.id)) {
      user = await User.findById(session.user.id)
    } else {
      user = await User.findOne({ lineUserId: session.user.id })
    }
    // const user = await User.findOne({lineUserId: session.user.id})
    console.log('user',user?._id);
    
    // if (!user) {
    //   return NextResponse.json({ error: 'ไม่พบข้อมูลผู้ใช้งาน' }, { status: 404 })
    // }
    
    const ObjectId = mongoose.Types.ObjectId

    // Check availability for all selected rooms
    for (const roomIdToCheck of selectedRoomIds) {
      const existingBookings = await Booking.find({
        $or: [
          { roomId: new mongoose.Types.ObjectId(roomIdToCheck) },
          { roomIds: new mongoose.Types.ObjectId(roomIdToCheck) }
        ],
        status: { $in: ['CONFIRMED'] }, // Only check against confirmed bookings to prevent duplicate bookings
        $and: [
          { checkIn: { $lt: checkOutDate } },
          { checkOut: { $gt: checkInDate } }
        ]
      })

      if (existingBookings.length > 0) {
        const room = await Room.findById(roomIdToCheck)
        const roomName = room?.name || roomIdToCheck
        return NextResponse.json(
          { error: `ห้องพัก ${roomName} ไม่ว่างในวันที่เลือก` },
          { status: 400 }
        )
      }
    }

    // Fetch rooms and calculate prices
    const rooms = await Room.find({
      _id: { $in: selectedRoomIds.map((id: string) => new mongoose.Types.ObjectId(id)) }
    })

    // Calculate prices for each room
    const roomPrices: Array<{ roomId: string; price: number }> = []
    let calculatedTotalPrice = 0

    for (const room of rooms) {
      const { totalPrice: roomTotal } = calculateRoomPriceRange(
        room,
        checkInDate,
        checkOutDate
      )
      calculatedTotalPrice += roomTotal
      roomPrices.push({
        roomId: room._id.toString(),
        price: roomTotal
      })
    }

    // Use calculated price or provided price
    const finalTotalPrice = totalPrice || calculatedTotalPrice

    
    // Determine booking status: manual bookings from admin are always CONFIRMED, others are PENDING
    const finalBookingStatus = isManualBooking ? 'CONFIRMED' : (bookingStatus || 'PENDING')
    
    // Create booking
    const booking = new Booking({
      roomId: new mongoose.Types.ObjectId(selectedRoomIds[0]), // Keep first room for backward compatibility
      roomIds: selectedRoomIds.map((id: string) => new mongoose.Types.ObjectId(id)), // Multiple rooms
      rooms: roomPrices.map(rp => ({
        roomId: new mongoose.Types.ObjectId(rp.roomId),
        price: rp.price
      })),
      userId: new ObjectId(user?._id),
      checkIn: checkInDate,
      checkOut: checkOutDate,
      totalPrice: finalTotalPrice,
      guestName,
      guestEmail,
      guestPhone,
      specialRequests,
      paymentType,
      discount: validDiscount,
      discountAmount: validDiscountAmount,
      status: finalBookingStatus, // CONFIRMED for manual bookings, PENDING for regular bookings until payment
      isManualBooking: isManualBooking || false,
    })

    await booking.save()
    
    // Verify discount was saved
    const savedBooking = await Booking.findById(booking._id)
    console.log('Booking saved with discount:', { 
      bookingId: booking._id,
      discount: savedBooking?.discount,
      discountAmount: savedBooking?.discountAmount,
      totalPrice: savedBooking?.totalPrice
    })

    // Populate for response
    await booking.populate('roomId', 'name description price capacity imageUrls pricing')
    if (booking.roomIds && booking.roomIds.length > 0) {
      await booking.populate('roomIds', 'name description price capacity imageUrls pricing')
    }
    await booking.populate('userId', 'lineUserId')

    // Create payment record
    const { default: Payment } = await import('@/models/Payment')
    
    // Calculate payment amounts based on payment type
    let paymentAmount: number
    let paidAmount: number
    let remainingAmount: number
    
    if (paymentType === 'FULL') {
      paymentAmount = finalTotalPrice
      paidAmount = finalTotalPrice
      remainingAmount = 0
    } else { // PARTIAL
      paymentAmount = Math.round(finalTotalPrice * 0.5) // 50% down payment
      paidAmount = paymentAmount
      remainingAmount = finalTotalPrice - paymentAmount
    }
    
    const payment = new Payment({
      bookingId: booking._id,
      amount: paymentAmount,
      totalAmount: finalTotalPrice,
      paidAmount: paidAmount,
      remainingAmount: remainingAmount,
      paymentType: paymentType,
    })
    await payment.save()

    // Update booking with payment ID
    booking.paymentId = payment._id
    await booking.save()

    // Populate payment for response
    await booking.populate('paymentId', 'status amount totalAmount paidAmount remainingAmount')

    // Transform the data to match frontend expectations
    const bookingObj = booking.toObject()
    const transformedBooking = {
      ...bookingObj,
      id: bookingObj._id, // Ensure id is properly set
      room: booking.roomId,
      payment: booking.paymentId || { status: 'PENDING', amount: 0 }
    }

    return NextResponse.json(transformedBooking, { status: 201 })
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

