import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import mongoose from 'mongoose'
import CampingBlock from '@/models/CampingBlock'
import Building from '@/models/Building'

// GET - ดึงข้อมูลบล็อคกางเต๊นท์ทั้งหมด
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Ensure Building model is registered
    if (!mongoose.models.Building) {
      require('@/models/Building')
    }
    
    const campingBlocks = await CampingBlock.find({ isActive: true })
      .populate('buildingId', 'name buildingType x y')
      .sort({ createdAt: 1 })

    // Transform the data to match frontend expectations
    const transformedBlocks = campingBlocks.map(block => ({
      id: block._id.toString(),
      name: block.name,
      description: block.description,
      imageUrl: block.imageUrls && block.imageUrls.length > 0 ? block.imageUrls[0] : '/placeholder-camping.jpg',
      imageUrls: block.imageUrls || [],
      pricePerPerson: block.pricePerPerson,
      maxCapacity: block.maxCapacity,
      minCapacity: block.minCapacity || 1,
      amenities: block.amenities,
      isActive: block.isActive,
      buildingId: block.buildingId?._id?.toString(),
      buildingName: block.buildingId?.name,
      buildingType: block.buildingId?.buildingType,
      buildingX: block.buildingId?.x,
      buildingY: block.buildingId?.y,
    }))

    return NextResponse.json(transformedBlocks)
  } catch (error) {
    console.error('Error fetching camping blocks:', error)
    return NextResponse.json(
      { error: 'ไม่สามารถโหลดข้อมูลบล็อคกางเต๊นท์ได้' }, 
      { status: 500 }
    )
  }
}

// POST - สร้างบล็อคกางเต๊นท์ใหม่
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      name, 
      description, 
      imageUrl, 
      imageUrls, 
      pricePerPerson, 
      maxCapacity,
      minCapacity,
      amenities, 
      buildingId 
    } = body

    // Validate required fields
    const finalImageUrls = imageUrls || (imageUrl ? [imageUrl] : [])
    
    if (!name || !description || !finalImageUrls || !Array.isArray(finalImageUrls) || finalImageUrls.length === 0 || !pricePerPerson || !maxCapacity) {
      return NextResponse.json({ 
        error: 'กรุณากรอกข้อมูลที่จำเป็น: name, description, imageUrls (array), pricePerPerson, maxCapacity' 
      }, { status: 400 })
    }

    await connectDB()
    const blockData: any = {
      name,
      description,
      imageUrls: finalImageUrls,
      pricePerPerson,
      maxCapacity,
      minCapacity: minCapacity || 1,
      amenities: amenities || [],
      buildingId: buildingId || undefined,
    }

    const campingBlock = new CampingBlock(blockData)
    await campingBlock.save()

    return NextResponse.json(campingBlock, { status: 201 })
  } catch (error) {
    console.error('Error creating camping block:', error)
    return NextResponse.json(
      { error: 'ไม่สามารถสร้างบล็อคกางเต๊นท์ได้' }, 
      { status: 500 }
    )
  }
}

