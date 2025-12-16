import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import mongoose from 'mongoose'
import SiteMap from '@/models/SiteMap'
import Building from '@/models/Building'
import Room from '@/models/Room'

// GET - ดึงข้อมูลแผนผังพร้อมอาคารและห้องพัก
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // ดึง query parameter สำหรับ type (accommodation หรือ camping)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'accommodation' // default เป็น accommodation

    // ดึงแผนผังตาม type
    let siteMap = await SiteMap.findOne({ 
      isActive: true, 
      type: type as 'accommodation' | 'camping' 
    }).sort({ updatedAt: -1 })

    // ถ้าไม่มีข้อมูล ให้สร้างค่า default
    if (!siteMap) {
      const defaultName = type === 'camping' ? 'แผนผังลานกางเต๊นท์' : 'แผนผังห้องพัก'
      const defaultDescription = type === 'camping' 
        ? 'แผนผังลานกางเต๊นท์' 
        : 'แผนผังหลักของสถานที่'
      
      siteMap = await SiteMap.create({
        name: defaultName,
        description: defaultDescription,
        imageUrl: '/placeholder-map.jpg',
        type: type as 'accommodation' | 'camping',
      })
    }

    // ดึงข้อมูลอาคาร/จุดทั้งหมดตาม type
    // สำหรับ accommodation: ดึงอาคารและห้องพัก
    // สำหรับ camping: ดึงจุดกางเต๊นท์ (buildingType = 'camping')
    const buildingTypeFilter = type === 'camping' ? 'camping' : { $ne: 'camping' }
    const buildings = await Building.find({ 
      isActive: true,
      buildingType: buildingTypeFilter
    })
    
    // ดึงข้อมูล camping blocks สำหรับแผนผัง camping
    let campingBlocks: any[] = []
    if (type === 'camping') {
      const CampingBlock = require('@/models/CampingBlock').default
      campingBlocks = await CampingBlock.find({ isActive: true }).lean()
    }

    const buildingsWithRooms = await Promise.all(
      buildings.map(async (building) => {
        // สำหรับ camping: ใช้ campingBlocks จาก Building หรือจาก hotspot ที่ส่งมา
        // แต่จริงๆ แล้ว campingBlocks เก็บไว้ใน hotspot (ไม่ใช่ใน Building)
        // ดังนั้นเราจะดึงจาก Building.buildingId ที่เชื่อมโยงกับ CampingBlock
        // หรือถ้าไม่มีก็จะใช้ empty array (ให้แอดมินเลือกใน SiteMapEditor)
        if (type === 'camping') {
          // หา camping blocks ที่มี buildingId ตรงกับ building นี้ (ถ้ามีการเชื่อมโยง)
          const buildingIdStr = building._id.toString()
          const linkedBlocks = campingBlocks
            .filter(block => {
              if (!block.buildingId) return false
              // เปรียบเทียบ ObjectId โดยแปลงเป็น string
              const blockBuildingId = block.buildingId.toString ? block.buildingId.toString() : String(block.buildingId)
              return blockBuildingId === buildingIdStr
            })
            .map(block => block._id.toString())
          
          console.log(`Building ${building.name} (${buildingIdStr}) has ${linkedBlocks.length} linked camping blocks:`, linkedBlocks)
          
          return {
            id: building._id.toString(),
            x: building.x,
            y: building.y,
            buildingName: building.name,
            buildingType: building.buildingType,
            description: building.description,
            facilities: building.facilities,
            rooms: [],
            campingBlocks: linkedBlocks, // เริ่มต้นด้วย camping blocks ที่เชื่อมโยงกับ building
          }
        }
        
        // สำหรับ accommodation ดึงห้องพัก
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
      type: siteMap.type,
      name: siteMap.name,
      description: siteMap.description,
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
    const { imageUrl, name, description, type, hotspots } = body
    
    console.log('Site map POST - Received data:', {
      mapType: type,
      hotspotsCount: hotspots?.length,
      hotspots: hotspots?.map((h: any) => ({
        id: h.id,
        buildingName: h.buildingName,
        buildingType: h.buildingType,
        campingBlocks: h.campingBlocks,
        campingBlocksCount: h.campingBlocks?.length
      }))
    })

    // Validate data
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'กรุณาระบุรูปภาพแผนผัง' },
        { status: 400 }
      )
    }

    const mapType = (type || 'accommodation') as 'accommodation' | 'camping'

    // อัปเดต Building และ CampingBlock ตาม hotspots
    if (hotspots && Array.isArray(hotspots)) {
      const CampingBlock = require('@/models/CampingBlock').default
      
      for (const hotspot of hotspots) {
        // Validate hotspot.id
        if (!hotspot.id || !mongoose.Types.ObjectId.isValid(hotspot.id)) {
          console.error(`Invalid hotspot.id: ${hotspot.id}`)
          continue
        }
        
        // อัปเดต Building
        await Building.findByIdAndUpdate(hotspot.id, {
          name: hotspot.buildingName,
          description: hotspot.description,
          buildingType: hotspot.buildingType,
          facilities: hotspot.facilities || [],
          x: hotspot.x,
          y: hotspot.y,
        })

        // สำหรับ camping: อัปเดต camping blocks ที่เชื่อมโยงกับ building
        if (mapType === 'camping' && hotspot.campingBlocks) {
          const buildingObjectId = new mongoose.Types.ObjectId(hotspot.id)
          
          console.log(`Updating camping blocks for building ${hotspot.id}:`, {
            buildingId: buildingObjectId.toString(),
            campingBlocks: hotspot.campingBlocks
          })
          
          // Unlink all camping blocks from this building first
          const unlinkResult = await CampingBlock.updateMany(
            { buildingId: buildingObjectId },
            { $unset: { buildingId: 1 } }
          )
          console.log(`Unlinked ${unlinkResult.modifiedCount} camping blocks from building ${hotspot.id}`)
          
          // Link selected camping blocks to this building
          if (hotspot.campingBlocks.length > 0) {
            const campingBlockIds = hotspot.campingBlocks
              .filter((id: string) => id && mongoose.Types.ObjectId.isValid(id))
              .map((id: string) => new mongoose.Types.ObjectId(id))
            
            console.log(`Linking ${campingBlockIds.length} camping blocks to building ${hotspot.id}:`, 
              campingBlockIds.map((id: any) => id.toString()))
            
            if (campingBlockIds.length > 0) {
              const linkResult = await CampingBlock.updateMany(
                { _id: { $in: campingBlockIds } },
                { buildingId: buildingObjectId }
              )
              console.log(`Linked ${linkResult.modifiedCount} camping blocks to building ${hotspot.id}`)
            }
          }
        }
      }
    }

    // หาแผนผังเดิมตาม type
    let siteMap = await SiteMap.findOne({ 
      isActive: true, 
      type: mapType 
    })

    if (siteMap) {
      // Update existing
      siteMap.imageUrl = imageUrl
      if (name) siteMap.name = name
      if (description) siteMap.description = description
      await siteMap.save()
    } else {
      // Create new
      const defaultName = mapType === 'camping' ? 'แผนผังลานกางเต๊นท์' : 'แผนผังห้องพัก'
      const defaultDescription = mapType === 'camping' 
        ? 'แผนผังลานกางเต๊นท์' 
        : 'แผนผังหลักของสถานที่'
      
      siteMap = await SiteMap.create({
        name: name || defaultName,
        description: description || defaultDescription,
        imageUrl,
        type: mapType,
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

