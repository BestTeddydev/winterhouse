import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Building from '@/models/Building'

// GET - ดึงข้อมูลอาคารทั้งหมด
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const buildings = await Building.find({ isActive: true }).sort({ createdAt: -1 })

    return NextResponse.json(buildings)
  } catch (error) {
    console.error('Error fetching buildings:', error)
    return NextResponse.json({ error: 'ไม่สามารถโหลดข้อมูลอาคารได้' }, { status: 500 })
  }
}

// POST - สร้างอาคารใหม่
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, buildingType, facilities, x, y } = body

    // Validate required fields
    if (!name || !description || !buildingType || x === undefined || y === undefined) {
      return NextResponse.json({ 
        error: 'กรุณากรอกข้อมูลที่จำเป็น: name, description, buildingType, x, y' 
      }, { status: 400 })
    }

    await connectDB()
    const building = new Building({
      name,
      description,
      buildingType,
      facilities: facilities || [],
      x,
      y,
    })

    await building.save()

    return NextResponse.json(building, { status: 201 })
  } catch (error) {
    console.error('Error creating building:', error)
    return NextResponse.json({ error: 'ไม่สามารถสร้างอาคารได้' }, { status: 500 })
  }
}
