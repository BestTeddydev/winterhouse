import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { apiErrorResponse, findSessionUser, isStaff } from '@/lib/api-auth'
import connectDB from '@/lib/db'
import { isValidId } from '@/lib/odm'
import Booking from '@/models/Booking'
import Payment from '@/models/Payment'

// Always read live data; never pre-render at build time
export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    await connectDB()

    // Validate id format
    if (!isValidId(params.id)) {
      return NextResponse.json({ error: 'รูปแบบ Booking ID ไม่ถูกต้อง' }, { status: 400 })
    }

    const bookingId = params.id

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
        path: 'campingBlockId',
        select: 'name description pricePerPerson minCapacity maxCapacity imageUrls'
      })
      .populate({
        path: 'campingBlockIds',
        select: 'name description pricePerPerson minCapacity maxCapacity imageUrls'
      })
      .populate({
        path: 'paymentId',
        select: 'status amount totalAmount paidAmount remainingAmount paymentType paymentSlipUrl'
      })
      .populate({
        path: 'userId',
        select: 'name email lineUserId'
      })

    if (!booking) {
      return NextResponse.json({ error: 'ไม่พบการจอง' }, { status: 404 })
    }
    
    // Customers may only view their own bookings
    if (!isStaff(session)) {
      const user = await findSessionUser(session)
      const bookingUserId = booking.userId?._id ?? booking.userId
      if (!user || String(bookingUserId) !== user._id) {
        return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึงการจองนี้' }, { status: 403 })
      }
    }

    return NextResponse.json(booking)
  } catch (error) {
    return apiErrorResponse(error, 'ไม่สามารถโหลดข้อมูลการจองได้')
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

    // Only ADMIN and OWNER can update bookings
    if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์แก้ไขการจอง' }, { status: 403 })
    }

    await connectDB()

    // Validate id format
    if (!isValidId(params.id)) {
      return NextResponse.json({ error: 'รูปแบบ Booking ID ไม่ถูกต้อง' }, { status: 400 })
    }

    const bookingId = params.id
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
    if (body.guestPhone !== undefined) updateData.guestPhone = body.guestPhone
    if (body.guestCount !== undefined) updateData.guestCount = body.guestCount
    if (body.specialRequests !== undefined) updateData.specialRequests = body.specialRequests
    if (body.manualBookingNotes !== undefined) updateData.manualBookingNotes = body.manualBookingNotes
    if (body.totalPrice !== undefined) updateData.totalPrice = body.totalPrice
    if (body.discount !== undefined) updateData.discount = body.discount
    if (body.discountAmount !== undefined) updateData.discountAmount = body.discountAmount

    // Update booking status - accept both 'status' and 'bookingStatus'
    if (body.status) updateData.status = body.status
    if (body.bookingStatus) updateData.status = body.bookingStatus

    // Update rooms - handle both roomId (single) and roomIds (multiple)
    if (body.roomIds !== undefined) {
      if (Array.isArray(body.roomIds) && body.roomIds.length > 0) {
        updateData.roomIds = body.roomIds
        // Clear single roomId if switching to multiple rooms
        updateData.roomId = null
      } else {
        // Empty array means no rooms
        updateData.roomIds = []
        updateData.roomId = null
      }
    } else if (body.roomId !== undefined) {
      if (body.roomId === null) {
        // Explicitly clear roomId
        updateData.roomId = null
      } else if (body.roomId) {
        updateData.roomId = body.roomId
        // Clear roomIds if switching to single room
        updateData.roomIds = []
      }
    }

    // Update camping blocks - handle both campingBlockId (single) and campingBlockIds (multiple)
    if (body.campingBlockIds !== undefined) {
      if (Array.isArray(body.campingBlockIds) && body.campingBlockIds.length > 0) {
        updateData.campingBlockIds = body.campingBlockIds
        // Clear single campingBlockId if switching to multiple blocks
        updateData.campingBlockId = null
      } else {
        // Empty array means no camping blocks
        updateData.campingBlockIds = []
        updateData.campingBlockId = null
      }
    } else if (body.campingBlockId !== undefined) {
      if (body.campingBlockId === null) {
        // Explicitly clear campingBlockId
        updateData.campingBlockId = null
      } else if (body.campingBlockId) {
        updateData.campingBlockId = body.campingBlockId
        // Clear campingBlockIds if switching to single block
        updateData.campingBlockIds = []
      }
    }

    // Update guest counts for camping blocks
    if (body.guestCounts !== undefined) {
      if (Array.isArray(body.guestCounts)) {
        updateData.guestCounts = body.guestCounts
      }
    }

    // Update addons
    if (body.addOns !== undefined) {
      if (Array.isArray(body.addOns)) {
        updateData.addOns = body.addOns.map((addOn: any) => ({
          addOnId: addOn.addOnId,
          name: addOn.name,
          price: addOn.price,
          quantity: addOn.quantity || 1,
          unit: addOn.unit || 'หน่วย'
        }))
      } else {
        updateData.addOns = []
      }
    }

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
      path: 'campingBlockId',
      select: 'name description pricePerPerson minCapacity maxCapacity imageUrls'
    }).populate({
      path: 'campingBlockIds',
      select: 'name description pricePerPerson minCapacity maxCapacity imageUrls'
    }).populate({
      path: 'paymentId',
      select: 'status amount totalAmount paidAmount remainingAmount paymentType paymentSlipUrl'
    }).populate({
      path: 'userId',
      select: 'name email lineUserId'
    })

    // Update payment status if provided
    if (body.paymentStatus && existingBooking.paymentId) {
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

  } catch (error) {
    return apiErrorResponse(error, 'ไม่สามารถอัพเดทการจองได้')
  }
}
