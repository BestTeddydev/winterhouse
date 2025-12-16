import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import CampingBlockBlock from '@/models/CampingBlockBlock'
import mongoose from 'mongoose'

// GET - ดึงข้อมูลการล็อคบล็อคกางเต๊นท์ทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'OWNER')) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const campingBlockId = searchParams.get('campingBlockId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const activeOnly = searchParams.get('activeOnly') === 'true'

    let query: any = {}
    
    if (campingBlockId) {
      query.campingBlockId = new mongoose.Types.ObjectId(campingBlockId)
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

    const blocks = await CampingBlockBlock.find(query)
      .populate('campingBlockId', 'name')
      .populate('createdBy', 'name email')
      .sort({ startDate: 1 })

    return NextResponse.json(blocks)
  } catch (error) {
    console.error('Error fetching camping block blocks:', error)
    return NextResponse.json({ error: 'ไม่สามารถโหลดข้อมูลการล็อคบล็อคกางเต๊นท์ได้' }, { status: 500 })
  }
}

// POST - สร้างการล็อคบล็อคกางเต๊นท์ใหม่
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'OWNER')) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    const body = await request.json()
    const { campingBlockId, startDate, endDate, reason } = body

    if (!campingBlockId || !startDate || !endDate) {
      return NextResponse.json({ error: 'กรุณาระบุ campingBlockId, startDate และ endDate' }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start >= end) {
      return NextResponse.json({ error: 'วันที่เริ่มต้นต้องมาก่อนวันที่สิ้นสุด' }, { status: 400 })
    }

    await connectDB()

    // Check if there's an overlapping block
    const overlappingBlock = await CampingBlockBlock.findOne({
      campingBlockId: new mongoose.Types.ObjectId(campingBlockId),
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
        error: 'มีการล็อคบล็อคกางเต๊นท์ในช่วงเวลานี้อยู่แล้ว',
        overlappingBlock: {
          id: overlappingBlock._id,
          startDate: overlappingBlock.startDate,
          endDate: overlappingBlock.endDate
        }
      }, { status: 400 })
    }

    const campingBlockBlock = new CampingBlockBlock({
      campingBlockId: new mongoose.Types.ObjectId(campingBlockId),
      startDate: start,
      endDate: end,
      reason: reason || '',
      isActive: true,
      createdBy: session.user?.id ? new mongoose.Types.ObjectId(session.user.id) : undefined
    })

    await campingBlockBlock.save()
    await campingBlockBlock.populate('campingBlockId', 'name')
    await campingBlockBlock.populate('createdBy', 'name email')

    return NextResponse.json(campingBlockBlock, { status: 201 })
  } catch (error) {
    console.error('Error creating camping block block:', error)
    return NextResponse.json({ error: 'ไม่สามารถสร้างการล็อคบล็อคกางเต๊นท์ได้' }, { status: 500 })
  }
}

