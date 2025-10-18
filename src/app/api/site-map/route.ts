import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import SiteMap from '@/models/SiteMap'
import Building from '@/models/Building'
import Room from '@/models/Room'

// GET - ดึงข้อมูลแผนผังพร้อมอาคารและห้องพัก
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // ดึงแผนผังล่าสุด (ควรมีแค่ 1 document)
    let siteMap = await SiteMap.findOne({ isActive: true }).sort({ updatedAt: -1 })

    // ถ้าไม่มีข้อมูล ให้สร้างค่า default
    if (!siteMap) {
      siteMap = await SiteMap.create({
        name: 'แผนผังหลัก',
        description: 'แผนผังหลักของสถานที่',
        imageUrl: '/placeholder-map.jpg',
      })
    }

    // ดึงข้อมูลอาคารทั้งหมดพร้อมห้องพัก
    const buildings = await Building.find({ isActive: true })
    const buildingsWithRooms = await Promise.all(
      buildings.map(async (building) => {
        const rooms = await Room.find({ 
          buildingId: building._id, 
          isActive: true 
        }).select('_id name price capacity imageUrls')
        
        return {
          id: building._id.toString(),
          x: building.x,
          y: building.y,
          buildingName: building.name,
          buildingType: building.buildingType,
          description: building.description,
          facilities: building.facilities,
          rooms: rooms.map(room => room._id.toString()),
        }
      })
    )

    return NextResponse.json({
      imageUrl: siteMap.imageUrl,
      hotspots: buildingsWithRooms,
    })
  } catch (error) {
    console.error('Error fetching site map:', error)
    return NextResponse.json(
      { error: 'ไม่สามารถโหลดข้อมูลแผนผังได้' },
      { status: 500 }
    )
  }
}

// POST - บันทึกข้อมูลแผนผัง
export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบ authentication
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      )
    }

    await connectDB()

    const body = await request.json()
    const { imageUrl, name, description } = body

    // Validate data
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'กรุณาระบุรูปภาพแผนผัง' },
        { status: 400 }
      )
    }

    // ลบแผนผังเดิมและสร้างใหม่ (หรือ update ถ้ามีอยู่แล้ว)
    let siteMap = await SiteMap.findOne({ isActive: true })

    if (siteMap) {
      // Update existing
      siteMap.imageUrl = imageUrl
      if (name) siteMap.name = name
      if (description) siteMap.description = description
      await siteMap.save()
    } else {
      // Create new
      siteMap = await SiteMap.create({
        name: name || 'แผนผังหลัก',
        description: description || 'แผนผังหลักของสถานที่',
        imageUrl,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'บันทึกแผนผังสำเร็จ',
      data: {
        id: siteMap._id,
        name: siteMap.name,
        description: siteMap.description,
        imageUrl: siteMap.imageUrl,
      },
    })
  } catch (error) {
    console.error('Error saving site map:', error)
    return NextResponse.json(
      { error: 'ไม่สามารถบันทึกแผนผังได้' },
      { status: 500 }
    )
  }
}

// DELETE - ลบแผนผัง (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    // ตรวจสอบ authentication
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      )
    }

    await connectDB()

    // Soft delete - เปลี่ยน isActive เป็น false
    const siteMap = await SiteMap.findOneAndUpdate(
      { isActive: true },
      { isActive: false },
      { new: true }
    )

    if (!siteMap) {
      return NextResponse.json({ error: 'ไม่พบแผนผัง' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'ลบแผนผังสำเร็จ',
    })
  } catch (error) {
    console.error('Error deleting site map:', error)
    return NextResponse.json(
      { error: 'ไม่สามารถลบแผนผังได้' },
      { status: 500 }
    )
  }
}

