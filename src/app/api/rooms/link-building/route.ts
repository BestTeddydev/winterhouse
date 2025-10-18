import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Room from '@/models/Room'
import Building from '@/models/Building'

// POST - ผูกห้องพักกับอาคาร
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 401 })
    }

    const body = await request.json()
    const { roomId, buildingId } = body

    // Validate required fields
    if (!roomId || !buildingId) {
      return NextResponse.json({ 
        error: 'กรุณาระบุ roomId และ buildingId' 
      }, { status: 400 })
    }

    await connectDB()
    
    // Validate that building exists
    const building = await Building.findById(buildingId)
    if (!building) {
      return NextResponse.json({ error: 'ไม่พบอาคาร' }, { status: 404 })
    }
    
    // Update room with buildingId
    const room = await Room.findByIdAndUpdate(
      roomId,
      { buildingId },
      { new: true }
    )

    if (!room) {
      return NextResponse.json({ error: 'ไม่พบห้องพัก' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'ผูกห้องพักกับอาคารสำเร็จ',
      room
    })
  } catch (error) {
    console.error('Error linking room to building:', error)
    return NextResponse.json({ error: 'ไม่สามารถผูกห้องพักกับอาคารได้' }, { status: 500 })
  }
}

// DELETE - ยกเลิกการผูกห้องพักกับอาคาร
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 401 })
    }

    const body = await request.json()
    const { roomId } = body

    // Validate required fields
    if (!roomId) {
      return NextResponse.json({ 
        error: 'กรุณาระบุ roomId' 
      }, { status: 400 })
    }

    await connectDB()
    
    // Remove buildingId from room
    const room = await Room.findByIdAndUpdate(
      roomId,
      { $unset: { buildingId: 1 } },
      { new: true }
    )

    if (!room) {
      return NextResponse.json({ error: 'ไม่พบห้องพัก' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'ยกเลิกการผูกห้องพักกับอาคารสำเร็จ',
      room
    })
  } catch (error) {
    console.error('Error unlinking room from building:', error)
    return NextResponse.json({ error: 'ไม่สามารถยกเลิกการผูกห้องพักกับอาคารได้' }, { status: 500 })
  }
}
