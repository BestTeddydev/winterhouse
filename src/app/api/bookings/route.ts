import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { apiErrorResponse, findSessionUser } from '@/lib/api-auth'
import connectDB from '@/lib/db'
import Booking from '@/models/Booking'
import Room from '@/models/Room'
import Payment from '@/models/Payment'
import User from '@/models/User'
import CampingBlock from '@/models/CampingBlock'
import CampingBlockBlock from '@/models/CampingBlockBlock'
import RoomBlock from '@/models/RoomBlock'
import { sendLineNotification, formatBookingNotification } from '@/lib/line'
import { calculateRoomPriceRange } from '@/lib/pricing'
import { isValidId } from '@/lib/odm'

// Always read live data; never pre-render at build time
export const dynamic = 'force-dynamic'

const SORT_FIELDS = ['checkIn', 'createdAt', 'totalPrice']

// Search text is matched literally (user input must not be interpreted as a regex)
function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
const ROOM_FIELDS = 'name description price capacity imageUrls'
const CAMPING_BLOCK_FIELDS = 'name description pricePerPerson minCapacity maxCapacity imageUrls'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const limit = Math.min(10000, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20))
    const sortBy = searchParams.get('sortBy') || 'checkIn' // Default sort by checkIn
    const sortOrder = searchParams.get('sortOrder') || 'asc' // Default ascending
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const dateFilterType = searchParams.get('dateFilterType') || 'createdAt' // 'checkIn' or 'createdAt'
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const paymentStatus = searchParams.get('paymentStatus') || ''

    await connectDB()

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
      const user = await findSessionUser(session)
      
      if (!user) {
        return NextResponse.json({ error: 'ไม่พบผู้ใช้ในระบบ' }, { status: 404 })
      }
      
      query.userId = user._id
    } else if (userId) {
      // Validate userId from query params
      if (!isValidId(userId)) {
        return NextResponse.json({ error: 'รูปแบบ userId ไม่ถูกต้อง' }, { status: 400 })
      }
      
      query.userId = userId
    }

    // Add search filter if provided
    if (search && search.trim()) {
      const searchRegex = new RegExp(escapeRegExp(search.trim()), 'i') // Case-insensitive
      query.$or = [
        { guestName: searchRegex },
        { guestEmail: searchRegex },
        { guestPhone: searchRegex }
      ]
      
      // Also search by booking ID if it looks like a document id
      if (isValidId(search.trim())) {
        if (!query.$or) query.$or = []
        query.$or.push({ _id: search.trim() })
      }
    }
    
    // Add status filter if provided
    if (status && status !== 'all') {
      query.status = status
    }
    
    const sortField = SORT_FIELDS.includes(sortBy) ? sortBy : 'checkIn'
    const sortObject = { [sortField]: sortOrder === 'desc' ? -1 : 1 }

    // 1) Find matching booking ids with a light query (only the fields needed to filter and sort).
    //    Payment status lives on the payment documents, fetched in parallel with one query.
    const filterByPayment = Boolean(paymentStatus && paymentStatus !== 'all')
    const [candidates, payments] = await Promise.all([
      Booking.find(query).select('_id paymentId').sort(sortObject).lean().exec() as Promise<
        Array<{ _id: string; paymentId?: string }>
      >,
      filterByPayment ? Payment.find({ status: paymentStatus }).select('_id').lean().exec() : Promise.resolve([]),
    ])

    let matches = candidates
    if (filterByPayment) {
      const paymentIds = new Set(payments.map((p: { _id: string }) => p._id))
      // Bookings without a payment count as PENDING (as shown in the UI)
      matches = matches.filter((b) =>
        b.paymentId ? paymentIds.has(String(b.paymentId)) : paymentStatus === 'PENDING'
      )
    }

    const total = matches.length
    const totalPages = Math.ceil(total / limit)
    const pageIds = matches.slice((page - 1) * limit, page * limit).map((b) => b._id)

    // 2) Load and populate only the bookings on this page
    const pageBookings = pageIds.length
      ? await Booking.find({ _id: { $in: pageIds } })
          .populate('roomId', ROOM_FIELDS)
          .populate('roomIds', ROOM_FIELDS)
          .populate('campingBlockId', CAMPING_BLOCK_FIELDS)
          .populate('campingBlockIds', CAMPING_BLOCK_FIELDS)
          .populate('paymentId', 'status amount totalAmount paidAmount remainingAmount paymentType')
          .populate('userId', 'name email lineUserId')
      : []
    // Hydrated (not lean) so schema defaults like empty arrays are present
    const byId = new Map(pageBookings.map((b: any) => [b._id, b.toObject()]))

    const bookings = pageIds
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((booking: any) => ({
        ...booking,
        id: booking._id,
        room: booking.roomId,
        rooms: booking.roomIds?.length ? booking.roomIds : booking.roomId ? [booking.roomId] : [],
        campingBlock: booking.campingBlockId,
        campingBlocks: booking.campingBlockIds?.length
          ? booking.campingBlockIds
          : booking.campingBlockId
            ? [booking.campingBlockId]
            : [],
        payment: booking.paymentId || { status: 'PENDING', amount: 0 },
      }))

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    })
  } catch (error) {
    return apiErrorResponse(error, 'ไม่สามารถดึงข้อมูลการจองได้')
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
    } = body

    // Handle discount values - use nullish coalescing to allow 0 values
    const finalDiscount = discount !== undefined && discount !== null ? Number(discount) : 0
    const finalDiscountAmount = discountAmount !== undefined && discountAmount !== null ? Number(discountAmount) : 0
    
    // Ensure values are valid numbers and within bounds
    const validDiscount = Math.max(0, Math.min(100, Number.isNaN(finalDiscount) ? 0 : finalDiscount))
    const validDiscountAmount = Math.max(0, Number.isNaN(finalDiscountAmount) ? 0 : finalDiscountAmount)

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

    // Validate id formats
    if (selectedCampingBlockIds.length > 0) {
      for (const id of selectedCampingBlockIds) {
        if (!isValidId(id)) {
          return NextResponse.json({ error: `รูปแบบ Camping Block ID ไม่ถูกต้อง: ${id}` }, { status: 400 })
        }
      }
      if (selectedGuestCounts.length !== selectedCampingBlockIds.length) {
        return NextResponse.json({ error: 'จำนวน guestCounts ต้องเท่ากับจำนวน campingBlockIds' }, { status: 400 })
      }
    } else if (selectedCampingBlockId) {
      if (!isValidId(selectedCampingBlockId)) {
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
      if (!isValidId(id)) {
        return NextResponse.json({ error: `รูปแบบ Room ID ไม่ถูกต้อง: ${id}` }, { status: 400 })
      }
    }
    
    // if (!session.user.id || !isValidId(session.user.id)) {
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
    
    // Check if check-in date is in the past (compare dates only, ignore time)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to midnight for date comparison
    
    const checkInDateOnly = new Date(checkInDate)
    checkInDateOnly.setHours(0, 0, 0, 0) // Reset time to midnight for date comparison
    
    if (checkInDateOnly < today) {
      return NextResponse.json({ error: 'วันเช็คอินไม่สามารถเป็นวันในอดีตได้' }, { status: 400 })
    }

    await connectDB()

    const user = await findSessionUser(session)

    // ถ้าไม่พบ user ให้ตอบเป็น 404 / 400 แทนที่จะปล่อยให้ไป error เป็น 500 ภายหลัง
    if (!user?._id) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้ใช้งานสำหรับสร้างการจอง' },
        { status: 404 }
      )
    }
    

    // Check availability for camping block(s) or rooms
    
    // Cache for camping blocks to avoid duplicate queries
    const campingBlockCache = new Map<string, any>()
    
    // Validate multiple camping blocks
    if (selectedCampingBlockIds.length > 0) {
      // Fetch all camping blocks in parallel
      const campingBlockPromises = selectedCampingBlockIds.map(id => 
        CampingBlock.findById(id)
      )
      const campingBlocks = await Promise.all(campingBlockPromises)
      
      // Validate each block
      for (let i = 0; i < campingBlocks.length; i++) {
        const campingBlock = campingBlocks[i]
        const blockId = selectedCampingBlockIds[i]
        const blockGuestCount = selectedGuestCounts[i]
        
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
        
        // Cache the block for later use
        campingBlockCache.set(blockId, campingBlock)
      }
      
      // Check for camping block blocks (locks) in one query
      const allCampingBlockBlocks = await CampingBlockBlock.find({
        campingBlockId: { $in: selectedCampingBlockIds },
        isActive: true,
        $and: [
          { startDate: { $lt: checkOutDate } },
          { endDate: { $gt: checkInDate } }
        ]
      })
      
      // Group blocks by campingBlockId
      const blocksByCampingBlockId = new Map<string, any[]>()
      allCampingBlockBlocks.forEach((block: any) => {
        const blockId = block.campingBlockId.toString()
        if (!blocksByCampingBlockId.has(blockId)) {
          blocksByCampingBlockId.set(blockId, [])
        }
        blocksByCampingBlockId.get(blockId)!.push(block)
      })
      
      // Check if any block is locked
      for (let i = 0; i < selectedCampingBlockIds.length; i++) {
        const blockId = selectedCampingBlockIds[i]
        const lockedBlocks = blocksByCampingBlockId.get(blockId)
        if (lockedBlocks && lockedBlocks.length > 0) {
          const campingBlock = campingBlockCache.get(blockId)
          const blockReason = lockedBlocks[0].reason ? ` (${lockedBlocks[0].reason})` : ''
          return NextResponse.json(
            { error: `บล็อคกางเต๊นท์ ${campingBlock?.name || blockId} ถูกล็อคไม่ให้จองในช่วงวันที่เลือก${blockReason}` },
            { status: 400 }
          )
        }
      }
    }
    // Validate single camping block
    else if (selectedCampingBlockId) {
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
      
      // Cache the block for later use
      campingBlockCache.set(selectedCampingBlockId, campingBlock)
      
      // Check for camping block blocks (locks)
      const campingBlockBlocks = await CampingBlockBlock.find({
        campingBlockId: selectedCampingBlockId,
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
      
      // Check availability for all selected rooms
      for (const roomIdToCheck of selectedRoomIds) {
        // Check for existing bookings
        const existingBookings = await Booking.find({
          $or: [
            { roomId: roomIdToCheck },
            { roomIds: roomIdToCheck }
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
          roomId: roomIdToCheck,
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
    
    // Calculate price for multiple camping blocks (use cached data)
    if (selectedCampingBlockIds.length > 0) {
      for (let i = 0; i < selectedCampingBlockIds.length; i++) {
        const blockId = selectedCampingBlockIds[i]
        const blockGuestCount = selectedGuestCounts[i]
        // Use cached camping block instead of querying again
        const campingBlock = campingBlockCache.get(blockId)
        if (campingBlock) {
          calculatedTotalPrice += campingBlock.pricePerPerson * blockGuestCount * nights
        }
      }
    }
    // Calculate price for single camping block (use cached data)
    else if (selectedCampingBlockId) {
      const campingBlock = campingBlockCache.get(selectedCampingBlockId)
      if (campingBlock) {
        calculatedTotalPrice += campingBlock.pricePerPerson * guestCount * nights
      }
    }
    
    // Calculate price for rooms (can be combined with camping blocks)
    if (selectedRoomIds.length > 0) {
      const rooms = await Room.find({
        _id: { $in: selectedRoomIds }
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
      addOnId: addOn.addOnId,
      name: addOn.name,
      price: addOn.price,
      quantity: addOn.quantity || 1,
      unit: addOn.unit || 'หน่วย'
    })) : undefined

    // Create booking
    const bookingData: any = {
      userId: user._id,
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
      bookingData.campingBlockIds = selectedCampingBlockIds
      bookingData.guestCounts = selectedGuestCounts
      // For backward compatibility, also set guestCount to the sum
      bookingData.guestCount = selectedGuestCounts.reduce((sum, count) => sum + count, 0)
    } else if (selectedCampingBlockId) {
      bookingData.campingBlockId = selectedCampingBlockId
      bookingData.guestCount = guestCount
    }
    
    // Add room(s) data
    if (selectedRoomIds.length > 0) {
      bookingData.roomId = selectedRoomIds[0] // Keep first room for backward compatibility
      bookingData.roomIds = selectedRoomIds // Multiple rooms
      bookingData.rooms = roomPrices.map(rp => ({
        roomId: rp.roomId,
        price: rp.price
      }))
    }

    const booking = new Booking(bookingData)

    await booking.save()

    // Populate for response
    await booking.populate('roomId', 'name description price capacity imageUrls pricing')
    if (booking.roomIds && booking.roomIds.length > 0) {
      await booking.populate('roomIds', 'name description price capacity imageUrls pricing')
    }
    await booking.populate('userId', 'lineUserId')

    // Create payment record
    
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

    // Populate payment for response (minimal populate for faster response)
    await booking.populate('paymentId', 'status amount totalAmount paidAmount remainingAmount')
    
    // Transform the data to match frontend expectations (before sending response)
    const bookingObj = booking.toObject()
    const transformedBooking = {
      ...bookingObj,
      id: bookingObj._id, // Ensure id is properly set
      room: booking.roomId,
      payment: booking.paymentId || { status: 'PENDING', amount: 0 }
    }

    // Send LINE notification to OWNER only for manual bookings (admin created)
    // For customer bookings, notification will be sent after payment success in webhook
    if (isManualBooking) {
      Promise.resolve().then(async () => {
        try {
          // Populate room data for notification (only if needed)
          if (booking.roomId || (booking.roomIds && booking.roomIds.length > 0)) {
            await booking.populate('roomId', 'name')
            if (booking.roomIds && booking.roomIds.length > 0) {
              await booking.populate('roomIds', 'name')
            }
          }
          
          const ownerUsers = await User.find({ 
            role: 'OWNER',
            lineUserId: { $exists: true, $ne: null }
          }).select('lineUserId name')
          
          if (ownerUsers.length > 0) {
            // Format booking notification message
            const notificationMessage = formatBookingNotification(booking)
            
            // Send notification to all OWNER users (fire and forget)
            const notificationPromises = ownerUsers
              .filter(owner => owner.lineUserId)
              .map(owner => 
                sendLineNotification({
                  userId: owner.lineUserId!,
                  message: notificationMessage
                }).catch(error => {
                  console.error(`Error sending LINE notification to owner ${owner.name} (${owner.lineUserId}):`, error)
                })
              )
            
            await Promise.allSettled(notificationPromises)
          }
        } catch (error) {
          // Log error but don't fail the booking creation
          console.error('Error sending LINE notifications to OWNER:', error)
        }
      })
    }

    // Return response immediately (don't wait for LINE notifications)
    return NextResponse.json(transformedBooking, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error, 'ไม่สามารถสร้างการจองได้')
  }
}


