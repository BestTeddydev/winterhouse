import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import CampingBlock from '@/models/CampingBlock'

// GET - ดึงข้อมูลบล็อคกางเต๊นท์ตาม ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const block = await CampingBlock.findById(params.id)
      .populate('buildingId', 'name buildingType x y')

    if (!block) {
      return NextResponse.json({ error: 'ไม่พบบล็อคกางเต๊นท์' }, { status: 404 })
    }

    return NextResponse.json(block)
  } catch (error) {
    console.error('Error fetching camping block:', error)
    return NextResponse.json(
      { error: 'ไม่สามารถโหลดข้อมูลบล็อคกางเต๊นท์ได้' }, 
      { status: 500 }
    )
  }
}

// PUT - อัปเดตข้อมูลบล็อคกางเต๊นท์
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      buildingId,
      isActive
    } = body

    await connectDB()
    
    const updateData: any = {}
    
    // Only update fields that are provided
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (pricePerPerson !== undefined) updateData.pricePerPerson = pricePerPerson
    if (maxCapacity !== undefined) updateData.maxCapacity = maxCapacity
    if (minCapacity !== undefined) updateData.minCapacity = minCapacity
    if (amenities !== undefined) updateData.amenities = amenities
    if (isActive !== undefined) updateData.isActive = isActive
    
    // Handle buildingId - allow null to unset
    if (buildingId === null || buildingId === '') {
      // Unset buildingId
      await CampingBlock.findByIdAndUpdate(
        params.id,
        { $unset: { buildingId: 1 } }
      )
    } else if (buildingId !== undefined) {
      updateData.buildingId = buildingId
    }

    // Handle imageUrls
    if (imageUrls !== undefined) {
      const validUrls = Array.isArray(imageUrls) 
        ? imageUrls.filter((url: string) => url && url.trim() !== '' && !url.includes('placeholder'))
        : []
      updateData.imageUrls = validUrls
    } else if (imageUrl) {
      updateData.imageUrls = [imageUrl]
    }

    // Update the block
    const block = await CampingBlock.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    )

    if (!block) {
      return NextResponse.json({ error: 'ไม่พบบล็อคกางเต๊นท์' }, { status: 404 })
    }

    return NextResponse.json(block)
  } catch (error) {
    console.error('Error updating camping block:', error)
    return NextResponse.json(
      { error: 'ไม่สามารถอัปเดตบล็อคกางเต๊นท์ได้' }, 
      { status: 500 }
    )
  }
}

// DELETE - ลบบล็อคกางเต๊นท์ (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const block = await CampingBlock.findByIdAndUpdate(
      params.id,
      { isActive: false },
      { new: true }
    )

    if (!block) {
      return NextResponse.json({ error: 'ไม่พบบล็อคกางเต๊นท์' }, { status: 404 })
    }

    return NextResponse.json({ message: 'ลบบล็อคกางเต๊นท์สำเร็จ' })
  } catch (error) {
    console.error('Error deleting camping block:', error)
    return NextResponse.json(
      { error: 'ไม่สามารถลบบล็อคกางเต๊นท์ได้' }, 
      { status: 500 }
    )
  }
}

