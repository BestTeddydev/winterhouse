import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Building from '@/models/Building'
import Room from '@/models/Room'

// GET - ดึงข้อมูลอาคารและห้องพักในอาคารนั้น
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const building = await Building.findById(params.id)
    if (!building) {
      return NextResponse.json({ error: 'ไม่พบอาคาร' }, { status: 404 })
    }

    // ดึงห้องพักในอาคารนี้
    const rooms = await Room.find({ 
      buildingId: params.id, 
      isActive: true 
    }).sort({ createdAt: -1 })

    return NextResponse.json({
      building,
      rooms
    })
  } catch (error) {
    console.error('Error fetching building:', error)
    return NextResponse.json({ error: 'ไม่สามารถโหลดข้อมูลอาคารได้' }, { status: 500 })
  }
}

// PUT - อัปเดตอาคาร
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, buildingType, facilities, x, y, isActive } = body

    await connectDB()
    const building = await Building.findByIdAndUpdate(
      params.id,
      { name, description, buildingType, facilities, x, y, isActive },
      { new: true, runValidators: true }
    )

    if (!building) {
      return NextResponse.json({ error: 'ไม่พบอาคาร' }, { status: 404 })
    }

    return NextResponse.json(building)
  } catch (error) {
    console.error('Error updating building:', error)
    return NextResponse.json({ error: 'ไม่สามารถอัปเดตอาคารได้' }, { status: 500 })
  }
}

// DELETE - ลบอาคาร (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 401 })
    }

    await connectDB()
    
    // ตรวจสอบว่ามีห้องพักในอาคารนี้หรือไม่
    const roomsCount = await Room.countDocuments({ 
      buildingId: params.id, 
      isActive: true 
    })
    
    if (roomsCount > 0) {
      return NextResponse.json({ 
        error: 'ไม่สามารถลบอาคารได้ เนื่องจากยังมีห้องพักอยู่ในอาคารนี้' 
      }, { status: 400 })
    }

    // Soft delete - เปลี่ยน isActive เป็น false
    const building = await Building.findByIdAndUpdate(
      params.id,
      { isActive: false },
      { new: true }
    )

    if (!building) {
      return NextResponse.json({ error: 'ไม่พบอาคาร' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'ลบอาคารสำเร็จ',
      building 
    })
  } catch (error) {
    console.error('Error deleting building:', error)
    return NextResponse.json({ error: 'ไม่สามารถลบอาคารได้' }, { status: 500 })
  }
}
