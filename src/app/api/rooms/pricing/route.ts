import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Room from '@/models/Room'
import { calculateRoomPriceRange, getRoomPriceForDate, getPriceBreakdown } from '@/lib/pricing'

/**
 * POST /api/rooms/pricing
 * คำนวณราคาสำหรับห้องพักในช่วงวันที่ที่กำหนด
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { roomId, checkIn, checkOut } = body

    // Validate required fields
    if (!roomId) {
      return NextResponse.json(
        { success: false, error: 'ต้องระบุ Room ID' },
        { status: 400 }
      )
    }

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { success: false, error: 'ต้องระบุวันเช็คอินและเช็คเอาท์' },
        { status: 400 }
      )
    }

    // Validate dates
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'รูปแบบวันที่ไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    if (checkInDate >= checkOutDate) {
      return NextResponse.json(
        { success: false, error: 'วันเช็คเอาท์ต้องมากกว่าวันเช็คอิน' },
        { status: 400 }
      )
    }

    await connectDB()

    // Find room
    const room = await Room.findById(roomId)

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบห้องพัก' },
        { status: 404 }
      )
    }

    // Calculate price range
    const { totalPrice, dailyPrices } = calculateRoomPriceRange(
      room,
      checkInDate,
      checkOutDate
    )

    // Get breakdown
    const breakdown = getPriceBreakdown(room, checkInDate, checkOutDate)

    return NextResponse.json({
      success: true,
      data: {
        roomId: room._id,
        roomName: room.name,
        checkIn,
        checkOut,
        totalPrice,
        dailyPrices,
        breakdown,
        // Get base price for display
        basePrice: room.price,
        pricing: room.pricing || {
          weekday: room.price,
          weekend: room.price,
          holiday: room.price
        }
      }
    })
  } catch (error: any) {
    console.error('Error calculating room pricing:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'ไม่สามารถคำนวณราคาได้' 
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/rooms/pricing?roomId=xxx&checkIn=xxx&checkOut=xxx
 * คำนวณราคาสำหรับห้องพักในช่วงวันที่ที่กำหนด (GET method)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const roomId = searchParams.get('roomId')
    const checkIn = searchParams.get('checkIn')
    const checkOut = searchParams.get('checkOut')

    if (!roomId || !checkIn || !checkOut) {
      return NextResponse.json(
        { success: false, error: 'ต้องระบุ roomId, checkIn, และ checkOut' },
        { status: 400 }
      )
    }

    // Validate dates
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'รูปแบบวันที่ไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    await connectDB()

    // Find room
    const room = await Room.findById(roomId)

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบห้องพัก' },
        { status: 404 }
      )
    }

    // Calculate price range
    const { totalPrice, dailyPrices } = calculateRoomPriceRange(
      room,
      checkInDate,
      checkOutDate
    )

    // Get breakdown
    const breakdown = getPriceBreakdown(room, checkInDate, checkOutDate)

    return NextResponse.json({
      success: true,
      data: {
        roomId: room._id,
        roomName: room.name,
        checkIn,
        checkOut,
        totalPrice,
        dailyPrices,
        breakdown
      }
    })
  } catch (error: any) {
    console.error('Error calculating room pricing:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'ไม่สามารถคำนวณราคาได้' 
      },
      { status: 500 }
    )
  }
}

