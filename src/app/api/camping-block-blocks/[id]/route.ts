import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import CampingBlockBlock from '@/models/CampingBlockBlock'
import mongoose from 'mongoose'

// GET - ดึงข้อมูลการล็อคบล็อคกางเต๊นท์ตาม ID
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
    const campingBlockBlock = await CampingBlockBlock.findById(params.id)
      .populate('campingBlockId', 'name')
      .populate('createdBy', 'name email')

    if (!campingBlockBlock) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการล็อคบล็อคกางเต๊นท์' }, { status: 404 })
    }

    return NextResponse.json(campingBlockBlock)
  } catch (error) {
    console.error('Error fetching camping block block:', error)
    return NextResponse.json({ error: 'ไม่สามารถโหลดข้อมูลการล็อคบล็อคกางเต๊นท์ได้' }, { status: 500 })
  }
}

// PUT - อัปเดตการล็อคบล็อคกางเต๊นท์
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

    const campingBlockBlock = await CampingBlockBlock.findById(params.id)
    if (!campingBlockBlock) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการล็อคบล็อคกางเต๊นท์' }, { status: 404 })
    }

    // If updating dates, check for overlaps
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : campingBlockBlock.startDate
      const end = endDate ? new Date(endDate) : campingBlockBlock.endDate

      if (start >= end) {
        return NextResponse.json({ error: 'วันที่เริ่มต้นต้องมาก่อนวันที่สิ้นสุด' }, { status: 400 })
      }

      const overlappingBlock = await CampingBlockBlock.findOne({
        _id: { $ne: params.id },
        campingBlockId: campingBlockBlock.campingBlockId,
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

      if (startDate) campingBlockBlock.startDate = start
      if (endDate) campingBlockBlock.endDate = end
    }

    if (reason !== undefined) campingBlockBlock.reason = reason
    if (isActive !== undefined) campingBlockBlock.isActive = isActive

    await campingBlockBlock.save()
    await campingBlockBlock.populate('campingBlockId', 'name')
    await campingBlockBlock.populate('createdBy', 'name email')

    return NextResponse.json(campingBlockBlock)
  } catch (error) {
    console.error('Error updating camping block block:', error)
    return NextResponse.json({ error: 'ไม่สามารถอัปเดตการล็อคบล็อคกางเต๊นท์ได้' }, { status: 500 })
  }
}

// DELETE - ลบการล็อคบล็อคกางเต๊นท์
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
    await CampingBlockBlock.findByIdAndDelete(params.id)

    return NextResponse.json({ message: 'ลบการล็อคบล็อคกางเต๊นท์สำเร็จ' })
  } catch (error) {
    console.error('Error deleting camping block block:', error)
    return NextResponse.json({ error: 'ไม่สามารถลบการล็อคบล็อคกางเต๊นท์ได้' }, { status: 500 })
  }
}

