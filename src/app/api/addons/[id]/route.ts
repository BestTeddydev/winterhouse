import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { apiErrorResponse } from '@/lib/api-auth'
import connectDB from '@/lib/db'
import AddOn from '@/models/AddOn'
import { isValidId } from '@/lib/odm'

// Always read live data; never pre-render at build time
export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    await connectDB()

    // Validate id format
    if (!isValidId(params.id)) {
      return NextResponse.json({ error: 'รูปแบบ AddOn ID ไม่ถูกต้อง' }, { status: 400 })
    }

    const addOn = await AddOn.findById(params.id)

    if (!addOn) {
      return NextResponse.json({ error: 'ไม่พบอ๊อฟชั่นเสริม' }, { status: 404 })
    }

    return NextResponse.json(addOn, { status: 200 })
  } catch (error) {
    console.error('Error fetching add-on:', error)
    return NextResponse.json({ error: 'ไม่สามารถโหลดข้อมูลอ๊อฟชั่นเสริมได้' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    // Only ADMIN and OWNER can update add-ons
    if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์แก้ไขอ๊อฟชั่นเสริม' }, { status: 403 })
    }

    await connectDB()

    // Validate id format
    if (!isValidId(params.id)) {
      return NextResponse.json({ error: 'รูปแบบ AddOn ID ไม่ถูกต้อง' }, { status: 400 })
    }

    const body = await request.json()
    const { name, description, price, unit, isActive } = body

    // Prepare update data
    const updateData: any = {}
    
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'ต้องระบุชื่อรายการ' }, { status: 400 })
      }
      updateData.name = name.trim()
    }
    
    if (description !== undefined) {
      updateData.description = description?.trim() || ''
    }
    
    if (price !== undefined) {
      if (!price || price <= 0) {
        return NextResponse.json({ error: 'ต้องระบุราคาที่ถูกต้อง' }, { status: 400 })
      }
      updateData.price = Number(price)
    }
    
    if (unit !== undefined) {
      updateData.unit = unit?.trim() || 'หน่วย'
    }
    
    if (isActive !== undefined) {
      updateData.isActive = isActive
    }

    const addOn = await AddOn.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    )

    if (!addOn) {
      return NextResponse.json({ error: 'ไม่พบอ๊อฟชั่นเสริม' }, { status: 404 })
    }

    return NextResponse.json(addOn, { status: 200 })
  } catch (error: any) {
    return apiErrorResponse(error, 'ไม่สามารถแก้ไขอ๊อฟชั่นเสริมได้')
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    // Only ADMIN and OWNER can delete add-ons
    if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์ลบอ๊อฟชั่นเสริม' }, { status: 403 })
    }

    await connectDB()

    // Validate id format
    if (!isValidId(params.id)) {
      return NextResponse.json({ error: 'รูปแบบ AddOn ID ไม่ถูกต้อง' }, { status: 400 })
    }

    const addOn = await AddOn.findByIdAndDelete(params.id)

    if (!addOn) {
      return NextResponse.json({ error: 'ไม่พบอ๊อฟชั่นเสริม' }, { status: 404 })
    }

    return NextResponse.json({ message: 'ลบอ๊อฟชั่นเสริมสำเร็จ' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting add-on:', error)
    return NextResponse.json({ error: 'ไม่สามารถลบอ๊อฟชั่นเสริมได้' }, { status: 500 })
  }
}

