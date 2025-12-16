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
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const dateFilterType = searchParams.get('dateFilterType') || 'createdAt' // 'checkIn' or 'createdAt'
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const paymentStatus = searchParams.get('paymentStatus') || ''

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
    if (!mongoose.models.CampingBlock) {
      require('@/models/CampingBlock')
    }

    let query: any = {}
    
    // Add date range filter if provided
    if (dateFrom && dateTo) {
      const dateField = dateFilterType === 'checkIn' ? 'checkIn' : 'createdAt'
      
      // Create date objects for range query
      const fromDate = new Date(dateFrom)
      fromDate.setHours(0, 0, 0, 0)
      
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999)
      
      // Add date range filter: dateField >= fromDate AND dateField <= toDate
      query[dateField] = {
        $gte: fromDate,
        $lte: toDate
      }
    }
    
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

    // Add search filter if provided
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i') // Case-insensitive
      query.$or = [
        { guestName: searchRegex },
        { guestEmail: searchRegex },
        { guestPhone: searchRegex }
      ]
      
      // Also search by booking ID if it looks like an ObjectId
      if (mongoose.Types.ObjectId.isValid(search.trim())) {
        if (!query.$or) query.$or = []
        query.$or.push({ _id: new mongoose.Types.ObjectId(search.trim()) })
      }
    }
    
    // Add status filter if provided
    if (status && status !== 'all') {
      query.status = status
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

    // Fetch all bookings matching the query (before payment status filter)
    // We need to fetch all to filter by payment status, then paginate
    const allBookings = await Booking.find(query)
      .populate({
        path: 'roomId',
        model: 'Room',
        select: 'name description price capacity imageUrls'
      })
      .populate({
        path: 'roomIds',
        model: 'Room',
        select: 'name description price capacity imageUrls'
      })
      .populate({
        path: 'campingBlockId',
        model: 'CampingBlock',
        select: 'name description pricePerPerson minCapacity maxCapacity imageUrls'
      })
      .populate({
        path: 'campingBlockIds',
        model: 'CampingBlock',
        select: 'name description pricePerPerson minCapacity maxCapacity imageUrls'
      })
      .populate({
        path: 'paymentId',
        model: 'Payment',
        select: 'status amount totalAmount paidAmount remainingAmount paymentType'
      })
      .populate({
        path: 'userId',
        model: 'User',
        select: 'name email lineUserId'
      })
      .sort(sortObject)

    // Transform the data to match frontend expectations
    let transformedBookings = allBookings.map(booking => {
      const bookingObj = booking.toObject()
      // Get all rooms: use roomIds if available, otherwise use roomId
      const allRooms = (booking.roomIds && booking.roomIds.length > 0) 
        ? booking.roomIds 
        : (booking.roomId ? [booking.roomId] : [])
      
      // Get all camping blocks: use campingBlockIds if available, otherwise use campingBlockId
      const allCampingBlocks = (booking.campingBlockIds && booking.campingBlockIds.length > 0)
        ? booking.campingBlockIds
        : (booking.campingBlockId ? [booking.campingBlockId] : [])
      
      return {
        ...bookingObj,
        id: bookingObj._id, // Ensure id is properly set
        room: booking.roomId,
        rooms: allRooms, // Array of all rooms
        campingBlock: booking.campingBlockId,
        campingBlocks: allCampingBlocks, // Array of all camping blocks
        payment: booking.paymentId || { status: 'PENDING', amount: 0 }
      }
    })
    
    // Filter by payment status if provided (after populate)
    if (paymentStatus && paymentStatus !== 'all') {
      transformedBookings = transformedBookings.filter(booking => {
        return booking.payment?.status === paymentStatus
      })
    }

    // Calculate pagination after payment status filter
    const totalBookings = transformedBookings.length
    const skip = (page - 1) * limit
    const totalPages = Math.ceil(totalBookings / limit)
    
    // Apply pagination
    const paginatedBookings = transformedBookings.slice(skip, skip + limit)
    
    return NextResponse.json({
      bookings: paginatedBookings,
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
      campingBlockId, // สำหรับจองบล็อคกางเต๊นท์
      campingBlockIds, // สำหรับจองหลายบล็อคกางเต๊นท์
      checkIn,
      checkOut,
      totalPrice,
      guestName,
      guestEmail,
      guestPhone,
      guestCount, // จำนวนคนสำหรับบล็อคกางเต๊นท์ (single)
      guestCounts, // จำนวนคนสำหรับหลายบล็อคกางเต๊นท์
      specialRequests,
      paymentType = 'FULL', // Default to full payment
      discount,
      discountAmount,
      bookingStatus,
      isManualBooking = false,
      paymentSlipUrl, // URL of payment slip image
      addOns, // อ๊อฟชั่นเสริม
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
    // Support camping block(s) booking, single roomId, or multiple roomIds
    let selectedRoomIds: string[] = []
    let selectedCampingBlockId: string | null = null
    let selectedCampingBlockIds: string[] = []
    let selectedGuestCounts: number[] = []
    
    // Handle multiple camping blocks
    if (campingBlockIds && Array.isArray(campingBlockIds) && campingBlockIds.length > 0) {
      selectedCampingBlockIds = campingBlockIds.filter(id => id && id.trim() !== '' && id !== 'null')
      if (guestCounts && Array.isArray(guestCounts) && guestCounts.length === selectedCampingBlockIds.length) {
        selectedGuestCounts = guestCounts.map(count => Number(count)).filter(count => !isNaN(count) && count > 0)
      }
    }
    // Handle single camping block
    else if (campingBlockId && campingBlockId !== 'null') {
      selectedCampingBlockId = campingBlockId
    }
    
    // Handle multiple rooms
    if (roomIds && Array.isArray(roomIds) && roomIds.length > 0) {
      selectedRoomIds = roomIds.filter(id => id && id.trim() !== '' && id !== 'null')
    }
    // Handle single room
    else if (roomId && roomId !== 'null') {
      selectedRoomIds = [roomId]
    }
    
    if (selectedRoomIds.length === 0 && !selectedCampingBlockId && selectedCampingBlockIds.length === 0) {
      return NextResponse.json({ error: 'ต้องระบุ Room ID, Room IDs, Camping Block ID, หรือ Camping Block IDs' }, { status: 400 })
    }
    
    // Validate guest counts for multiple camping blocks
    if (selectedCampingBlockIds.length > 0 && selectedGuestCounts.length !== selectedCampingBlockIds.length) {
      return NextResponse.json({ error: 'จำนวน guestCounts ต้องเท่ากับจำนวน campingBlockIds' }, { status: 400 })
    }
    
    if (!checkIn || !checkOut) {
      return NextResponse.json({ error: 'ต้องระบุวันเช็คอินและเช็คเอาท์' }, { status: 400 })
    }
    
    // Validate guest information
    // For manual/admin bookings, guestEmail might have default value, but guestPhone can be optional
    if (!guestName) {
      return NextResponse.json({ error: 'ต้องระบุชื่อ-นามสกุลของผู้เข้าพัก' }, { status: 400 })
    }
    if (!guestEmail) {
      return NextResponse.json({ error: 'ต้องระบุอีเมลของผู้เข้าพัก' }, { status: 400 })
    }
    // guestPhone is optional for admin/manual bookings
    
    if (!totalPrice || totalPrice <= 0) {
      return NextResponse.json({ error: 'ต้องระบุราคารวมที่ถูกต้อง' }, { status: 400 })
    }

    // Validate payment type
    if (!['FULL', 'PARTIAL'].includes(paymentType)) {
      return NextResponse.json({ error: 'ประเภทการชำระเงินไม่ถูกต้อง' }, { status: 400 })
    }

    // Validate ObjectId formats
    if (selectedCampingBlockIds.length > 0) {
      for (const id of selectedCampingBlockIds) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return NextResponse.json({ error: `รูปแบบ Camping Block ID ไม่ถูกต้อง: ${id}` }, { status: 400 })
        }
      }
      if (selectedGuestCounts.length !== selectedCampingBlockIds.length) {
        return NextResponse.json({ error: 'จำนวน guestCounts ต้องเท่ากับจำนวน campingBlockIds' }, { status: 400 })
      }
    } else if (selectedCampingBlockId) {
      if (!mongoose.Types.ObjectId.isValid(selectedCampingBlockId)) {
        return NextResponse.json({ error: `รูปแบบ Camping Block ID ไม่ถูกต้อง: ${selectedCampingBlockId}` }, { status: 400 })
      }
      if (!guestCount || guestCount < 1) {
        return NextResponse.json({ error: 'ต้องระบุจำนวนคนที่ถูกต้องสำหรับบล็อคกางเต๊นท์' }, { status: 400 })
      }
    }
    
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

    // Check availability for camping block(s) or rooms
    const CampingBlock = require('@/models/CampingBlock').default
    
    // Validate multiple camping blocks
    if (selectedCampingBlockIds.length > 0) {
      const CampingBlockBlock = require('@/models/CampingBlockBlock').default
      
      for (let i = 0; i < selectedCampingBlockIds.length; i++) {
        const blockId = selectedCampingBlockIds[i]
        const blockGuestCount = selectedGuestCounts[i]
        const campingBlock = await CampingBlock.findById(blockId)
        if (!campingBlock) {
          return NextResponse.json({ error: `ไม่พบบล็อคกางเต๊นท์: ${blockId}` }, { status: 404 })
        }
        if (!campingBlock.isActive) {
          return NextResponse.json({ error: `บล็อคกางเต๊นท์นี้ปิดใช้งาน: ${campingBlock.name}` }, { status: 400 })
        }
        if (blockGuestCount < campingBlock.minCapacity || blockGuestCount > campingBlock.maxCapacity) {
          return NextResponse.json({ 
            error: `บล็อค ${campingBlock.name}: จำนวนคนต้องอยู่ระหว่าง ${campingBlock.minCapacity} - ${campingBlock.maxCapacity} คน` 
          }, { status: 400 })
        }
        
        // Check for camping block blocks (locks)
        const campingBlockBlocks = await CampingBlockBlock.find({
          campingBlockId: new mongoose.Types.ObjectId(blockId),
          isActive: true,
          $and: [
            { startDate: { $lt: checkOutDate } },
            { endDate: { $gt: checkInDate } }
          ]
        })
        
        if (campingBlockBlocks.length > 0) {
          const blockReason = campingBlockBlocks[0].reason ? ` (${campingBlockBlocks[0].reason})` : ''
          return NextResponse.json(
            { error: `บล็อคกางเต๊นท์ ${campingBlock.name} ถูกล็อคไม่ให้จองในช่วงวันที่เลือก${blockReason}` },
            { status: 400 }
          )
        }
      }
    }
    // Validate single camping block
    else if (selectedCampingBlockId) {
      const CampingBlockBlock = require('@/models/CampingBlockBlock').default
      
      const campingBlock = await CampingBlock.findById(selectedCampingBlockId)
      if (!campingBlock) {
        return NextResponse.json({ error: 'ไม่พบบล็อคกางเต๊นท์' }, { status: 404 })
      }
      if (!campingBlock.isActive) {
        return NextResponse.json({ error: 'บล็อคกางเต๊นท์นี้ปิดใช้งาน' }, { status: 400 })
      }
      if (guestCount < campingBlock.minCapacity || guestCount > campingBlock.maxCapacity) {
        return NextResponse.json({ 
          error: `จำนวนคนต้องอยู่ระหว่าง ${campingBlock.minCapacity} - ${campingBlock.maxCapacity} คน` 
        }, { status: 400 })
      }
      
      // Check for camping block blocks (locks)
      const campingBlockBlocks = await CampingBlockBlock.find({
        campingBlockId: new mongoose.Types.ObjectId(selectedCampingBlockId),
        isActive: true,
        $and: [
          { startDate: { $lt: checkOutDate } },
          { endDate: { $gt: checkInDate } }
        ]
      })
      
      if (campingBlockBlocks.length > 0) {
        const blockReason = campingBlockBlocks[0].reason ? ` (${campingBlockBlocks[0].reason})` : ''
        return NextResponse.json(
          { error: `บล็อคกางเต๊นท์ ${campingBlock.name} ถูกล็อคไม่ให้จองในช่วงวันที่เลือก${blockReason}` },
          { status: 400 }
        )
      }
    }
    
    // Check room availability
    if (selectedRoomIds.length > 0) {
      const RoomBlock = require('@/models/RoomBlock').default
      
      // Check availability for all selected rooms
      for (const roomIdToCheck of selectedRoomIds) {
        // Check for existing bookings
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
        
        // Check for room blocks (locks)
        const roomBlocks = await RoomBlock.find({
          roomId: new mongoose.Types.ObjectId(roomIdToCheck),
          isActive: true,
          $and: [
            { startDate: { $lt: checkOutDate } },
            { endDate: { $gt: checkInDate } }
          ]
        })
        
        if (roomBlocks.length > 0) {
          const room = await Room.findById(roomIdToCheck)
          const roomName = room?.name || roomIdToCheck
          const blockReason = roomBlocks[0].reason ? ` (${roomBlocks[0].reason})` : ''
          return NextResponse.json(
            { error: `ห้องพัก ${roomName} ถูกล็อคไม่ให้จองในช่วงวันที่เลือก${blockReason}` },
            { status: 400 }
          )
        }
      }
    }

    // Calculate price for camping block(s) and/or rooms
    let calculatedTotalPrice = 0
    let roomPrices: Array<{ roomId: string; price: number }> = []
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Calculate price for multiple camping blocks
    if (selectedCampingBlockIds.length > 0) {
      for (let i = 0; i < selectedCampingBlockIds.length; i++) {
        const blockId = selectedCampingBlockIds[i]
        const blockGuestCount = selectedGuestCounts[i]
        const campingBlock = await CampingBlock.findById(blockId)
        calculatedTotalPrice += campingBlock.pricePerPerson * blockGuestCount * nights
      }
    }
    // Calculate price for single camping block
    else if (selectedCampingBlockId) {
      const campingBlock = await CampingBlock.findById(selectedCampingBlockId)
      calculatedTotalPrice += campingBlock.pricePerPerson * guestCount * nights
    }
    
    // Calculate price for rooms (can be combined with camping blocks)
    if (selectedRoomIds.length > 0) {
      const rooms = await Room.find({
        _id: { $in: selectedRoomIds.map((id: string) => new mongoose.Types.ObjectId(id)) }
      })

      // Calculate prices for each room
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
    }

    // Use calculated price or provided price
    const finalTotalPrice = totalPrice || calculatedTotalPrice

    
    // Determine booking status: manual bookings from admin are always CONFIRMED, others are PENDING
    const finalBookingStatus = isManualBooking ? 'CONFIRMED' : (bookingStatus || 'PENDING')
    
    // Process add-ons if provided
    const processedAddOns = body.addOns && Array.isArray(body.addOns) ? body.addOns.map((addOn: any) => ({
      addOnId: new mongoose.Types.ObjectId(addOn.addOnId),
      name: addOn.name,
      price: addOn.price,
      quantity: addOn.quantity || 1,
      unit: addOn.unit || 'หน่วย'
    })) : undefined

    // Create booking
    const bookingData: any = {
      userId: new ObjectId(user?._id),
      checkIn: checkInDate,
      checkOut: checkOutDate,
      totalPrice: finalTotalPrice,
      guestName,
      guestEmail,
      ...(guestPhone && guestPhone.trim() !== '' ? { guestPhone } : {}), // Only include guestPhone if it has a value
      ...(specialRequests && specialRequests.trim() !== '' ? { specialRequests } : {}), // Only include specialRequests if it has a value
      paymentType,
      discount: validDiscount,
      discountAmount: validDiscountAmount,
      status: finalBookingStatus, // CONFIRMED for manual bookings, PENDING for regular bookings until payment
      isManualBooking: isManualBooking || false,
      addOns: processedAddOns
    }

    // Add camping block(s) data
    if (selectedCampingBlockIds.length > 0) {
      // Multiple camping blocks - store in a custom field (we'll need to add this to the model)
      bookingData.campingBlockIds = selectedCampingBlockIds.map((id: string) => new mongoose.Types.ObjectId(id))
      bookingData.guestCounts = selectedGuestCounts
      // For backward compatibility, also set guestCount to the sum
      bookingData.guestCount = selectedGuestCounts.reduce((sum, count) => sum + count, 0)
    } else if (selectedCampingBlockId) {
      bookingData.campingBlockId = new mongoose.Types.ObjectId(selectedCampingBlockId)
      bookingData.guestCount = guestCount
    }
    
    // Add room(s) data
    if (selectedRoomIds.length > 0) {
      bookingData.roomId = new mongoose.Types.ObjectId(selectedRoomIds[0]) // Keep first room for backward compatibility
      bookingData.roomIds = selectedRoomIds.map((id: string) => new mongoose.Types.ObjectId(id)) // Multiple rooms
      bookingData.rooms = roomPrices.map(rp => ({
        roomId: new mongoose.Types.ObjectId(rp.roomId),
        price: rp.price
      }))
    }

    const booking = new Booking(bookingData)

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
      paymentSlipUrl: paymentSlipUrl || undefined, // Add payment slip URL if provided
    })
    await payment.save()

    // Update booking with payment ID
    booking.paymentId = payment._id
    await booking.save()

    // Populate payment for response
    await booking.populate('paymentId', 'status amount totalAmount paidAmount remainingAmount')
    
    // Populate room data for notification
    await booking.populate('roomId', 'name')
    if (booking.roomIds && booking.roomIds.length > 0) {
      await booking.populate('roomIds', 'name')
    }

    // Send LINE notification to OWNER users
    try {
      const ownerUsers = await User.find({ 
        role: 'OWNER',
        lineUserId: { $exists: true, $ne: null }
      }).select('lineUserId name')
      
      if (ownerUsers.length > 0) {
        // Format booking notification message
        const notificationMessage = formatBookingNotification(booking)
        
        // Send notification to all OWNER users
        const notificationPromises = ownerUsers
          .filter(owner => owner.lineUserId)
          .map(owner => 
            sendLineNotification({
              userId: owner.lineUserId!,
              message: notificationMessage
            }).catch(error => {
              console.error(`Error sending LINE notification to owner ${owner.name} (${owner.lineUserId}):`, error)
              // Don't throw error, just log it so booking creation still succeeds
            })
          )
        
        await Promise.allSettled(notificationPromises)
        console.log(`Sent booking notification to ${ownerUsers.length} OWNER user(s)`)
      }
    } catch (error) {
      // Log error but don't fail the booking creation
      console.error('Error sending LINE notifications to OWNER:', error)
    }

    // Transform the data to match frontend expectations
    const bookingObj = booking.toObject()
    const transformedBooking = {
      ...bookingObj,
      id: bookingObj._id, // Ensure id is properly set
      room: booking.roomId,
      payment: booking.paymentId || { status: 'PENDING', amount: 0 }
    }

    return NextResponse.json(transformedBooking, { status: 201 })
  } 
catch (error) {
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

