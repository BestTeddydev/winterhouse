import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import RoomBlock from '@/models/RoomBlock'
import mongoose from 'mongoose'

// GET - ดึงข้อมูลการล็อคห้องทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'OWNER')) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const activeOnly = searchParams.get('activeOnly') === 'true'

    let query: any = {}
    
    if (roomId) {
      query.roomId = new mongoose.Types.ObjectId(roomId)
    }
    
    if (activeOnly) {
      query.isActive = true
    }
    
    // Filter by date range if provided
    if (startDate || endDate) {
      query.$or = []
      if (startDate && endDate) {
        // Find blocks that overlap with the date range
        query.$or.push({
          $and: [
            { startDate: { $lte: new Date(endDate) } },
            { endDate: { $gte: new Date(startDate) } }
          ]
        })
      } else if (startDate) {
        query.$or.push({ endDate: { $gte: new Date(startDate) } })
      } else if (endDate) {
        query.$or.push({ startDate: { $lte: new Date(endDate) } })
      }
    }

    const blocks = await RoomBlock.find(query)
      .populate('roomId', 'name')
      .populate('createdBy', 'name email')
      .sort({ startDate: 1 })

    return NextResponse.json(blocks)
  } catch (error) {
    console.error('Error fetching room blocks:', error)
    return NextResponse.json({ error: 'ไม่สามารถโหลดข้อมูลการล็อคห้องได้' }, { status: 500 })
  }
}

// POST - สร้างการล็อคห้องใหม่
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'OWNER')) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    const body = await request.json()
    const { roomId, startDate, endDate, reason } = body

    if (!roomId || !startDate || !endDate) {
      return NextResponse.json({ error: 'กรุณาระบุ roomId, startDate และ endDate' }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start >= end) {
      return NextResponse.json({ error: 'วันที่เริ่มต้นต้องมาก่อนวันที่สิ้นสุด' }, { status: 400 })
    }

    await connectDB()

    // Check if there's an overlapping block
    const overlappingBlock = await RoomBlock.findOne({
      roomId: new mongoose.Types.ObjectId(roomId),
      isActive: true,
      $or: [
        {
          $and: [
            { startDate: { $lte: end } },
            { endDate: { $gte: start } }
          ]
        }
      ]
    })

    if (overlappingBlock) {
      return NextResponse.json({ 
        error: 'มีการล็อคห้องในช่วงเวลานี้อยู่แล้ว',
        overlappingBlock: {
          id: overlappingBlock._id,
          startDate: overlappingBlock.startDate,
          endDate: overlappingBlock.endDate
        }
      }, { status: 400 })
    }

    const roomBlock = new RoomBlock({
      roomId: new mongoose.Types.ObjectId(roomId),
      startDate: start,
      endDate: end,
      reason: reason || '',
      isActive: true,
      createdBy: session.user?.id ? new mongoose.Types.ObjectId(session.user.id) : undefined
    })

    await roomBlock.save()
    await roomBlock.populate('roomId', 'name')
    await roomBlock.populate('createdBy', 'name email')

    return NextResponse.json(roomBlock, { status: 201 })
  } catch (error) {
    console.error('Error creating room block:', error)
    return NextResponse.json({ error: 'ไม่สามารถสร้างการล็อคห้องได้' }, { status: 500 })
  }
}

