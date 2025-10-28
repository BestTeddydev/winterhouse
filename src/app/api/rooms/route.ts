import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import mongoose from 'mongoose'
import Room from '@/models/Room'
import Building from '@/models/Building'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Ensure Building model is registered
    if (!mongoose.models.Building) {
      require('@/models/Building')
    }
    
    const rooms = await Room.find({ isActive: true })
      .populate('buildingId', 'name buildingType x y')
      .sort({ createdAt: -1 })

    // Transform the data to match frontend expectations
    const transformedRooms = rooms.map(room => ({
      id: room._id.toString(),
      name: room.name,
      description: room.description,
      imageUrl: room.imageUrls && room.imageUrls.length > 0 ? room.imageUrls[0] : '/placeholder-room.jpg',
      imageUrls: room.imageUrls || [],
      price: room.price,
      pricing: room.pricing,
      capacity: room.capacity,
      amenities: room.amenities,
      hotspots: [], // This will be populated by site map data
      isActive: room.isActive,
      buildingId: room.buildingId?._id?.toString(),
      buildingName: room.buildingId?.name,
      buildingType: room.buildingId?.buildingType,
      buildingX: room.buildingId?.x,
      buildingY: room.buildingId?.y,
    }))

    return NextResponse.json(transformedRooms)
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json({ error: 'ไม่สามารถโหลดข้อมูลห้องพักได้' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, imageUrl, imageUrls, price, capacity, amenities, buildingId, pricing } = body

    // Validate required fields
    const finalImageUrls = imageUrls || (imageUrl ? [imageUrl] : [])
    
    if (!name || !description || !finalImageUrls || !Array.isArray(finalImageUrls) || finalImageUrls.length === 0 || !price || !capacity) {
      return NextResponse.json({ 
        error: 'กรุณากรอกข้อมูลที่จำเป็น: name, description, imageUrls (array), price, capacity' 
      }, { status: 400 })
    }

    await connectDB()
    const roomData: any = {
      name,
      description,
      imageUrls: finalImageUrls,
      price,
      capacity,
      amenities: amenities || [],
      buildingId: buildingId || undefined,
    }

    // Add pricing if provided
    if (pricing && (pricing.weekday || pricing.weekend || pricing.holiday)) {
      roomData.pricing = {
        weekday: pricing.weekday || price,
        weekend: pricing.weekend || pricing.weekday || price,
        holiday: pricing.holiday || pricing.weekday || price
      }
    }

    const room = new Room(roomData)

    await room.save()

    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}

