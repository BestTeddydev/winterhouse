import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import SiteMap from '@/models/SiteMap'

// GET - ดึงข้อมูลแผนผัง
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // ดึงแผนผังล่าสุด (ควรมีแค่ 1 document)
    let siteMap = await SiteMap.findOne().sort({ updatedAt: -1 })

    // ถ้าไม่มีข้อมูล ให้สร้างค่า default
    if (!siteMap) {
      siteMap = await SiteMap.create({
        imageUrl: '/placeholder-map.jpg',
        hotspots: [],
      })
    }

    return NextResponse.json({
      imageUrl: siteMap.imageUrl,
      hotspots: siteMap.hotspots,
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
    const { imageUrl, hotspots } = body

    // Validate data
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'กรุณาระบุรูปภาพแผนผัง' },
        { status: 400 }
      )
    }

    // ลบแผนผังเดิมและสร้างใหม่ (หรือ update ถ้ามีอยู่แล้ว)
    let siteMap = await SiteMap.findOne()

    if (siteMap) {
      // Update existing
      siteMap.imageUrl = imageUrl
      siteMap.hotspots = hotspots || []
      await siteMap.save()
    } else {
      // Create new
      siteMap = await SiteMap.create({
        imageUrl,
        hotspots: hotspots || [],
      })
    }

    return NextResponse.json({
      success: true,
      message: 'บันทึกแผนผังสำเร็จ',
      data: {
        imageUrl: siteMap.imageUrl,
        hotspots: siteMap.hotspots,
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

// DELETE - ลบแผนผัง (optional)
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

    // ลบแผนผังทั้งหมด
    await SiteMap.deleteMany({})

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

