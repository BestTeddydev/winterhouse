import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import RoomBlock from '@/models/RoomBlock'
import mongoose from 'mongoose'

// GET - ดึงข้อมูลการล็อคห้องตาม ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'OWNER')) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    await connectDB()
    const roomBlock = await RoomBlock.findById(params.id)
      .populate('roomId', 'name')
      .populate('createdBy', 'name email')

    if (!roomBlock) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการล็อคห้อง' }, { status: 404 })
    }

    return NextResponse.json(roomBlock)
  } catch (error) {
    console.error('Error fetching room block:', error)
    return NextResponse.json({ error: 'ไม่สามารถโหลดข้อมูลการล็อคห้องได้' }, { status: 500 })
  }
}

// PUT - อัปเดตการล็อคห้อง
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'OWNER')) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    const body = await request.json()
    const { startDate, endDate, reason, isActive } = body

    await connectDB()

    const roomBlock = await RoomBlock.findById(params.id)
    if (!roomBlock) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการล็อคห้อง' }, { status: 404 })
    }

    // If updating dates, check for overlaps
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : roomBlock.startDate
      const end = endDate ? new Date(endDate) : roomBlock.endDate

      if (start >= end) {
        return NextResponse.json({ error: 'วันที่เริ่มต้นต้องมาก่อนวันที่สิ้นสุด' }, { status: 400 })
      }

      const overlappingBlock = await RoomBlock.findOne({
        _id: { $ne: params.id },
        roomId: roomBlock.roomId,
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

      if (startDate) roomBlock.startDate = start
      if (endDate) roomBlock.endDate = end
    }

    if (reason !== undefined) roomBlock.reason = reason
    if (isActive !== undefined) roomBlock.isActive = isActive

    await roomBlock.save()
    await roomBlock.populate('roomId', 'name')
    await roomBlock.populate('createdBy', 'name email')

    return NextResponse.json(roomBlock)
  } catch (error) {
    console.error('Error updating room block:', error)
    return NextResponse.json({ error: 'ไม่สามารถอัปเดตการล็อคห้องได้' }, { status: 500 })
  }
}

// DELETE - ลบการล็อคห้อง
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'OWNER')) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    await connectDB()
    await RoomBlock.findByIdAndDelete(params.id)

    return NextResponse.json({ message: 'ลบการล็อคห้องสำเร็จ' })
  } catch (error) {
    console.error('Error deleting room block:', error)
    return NextResponse.json({ error: 'ไม่สามารถลบการล็อคห้องได้' }, { status: 500 })
  }
}

