import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { apiErrorResponse } from '@/lib/api-auth'
import connectDB from '@/lib/db'
import AddOn from '@/models/AddOn'

// Always read live data; never pre-render at build time
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    let query: any = {}
    
    // Only return active add-ons if requested (for customer booking)
    if (activeOnly) {
      query.isActive = true
    }

    const addOns = await AddOn.find(query).sort({ createdAt: -1 })

    return NextResponse.json(addOns, { status: 200 })
  } catch (error) {
    console.error('Error fetching add-ons:', error)
    return NextResponse.json({ error: 'ไม่สามารถโหลดข้อมูลอ๊อฟชั่นเสริมได้' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    // Only ADMIN and OWNER can create add-ons
    if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์สร้างอ๊อฟชั่นเสริม' }, { status: 403 })
    }

    await connectDB()

    const body = await request.json()
    const { name, description, price, unit, isActive } = body

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'ต้องระบุชื่อรายการ' }, { status: 400 })
    }

    if (!price || price <= 0) {
      return NextResponse.json({ error: 'ต้องระบุราคาที่ถูกต้อง' }, { status: 400 })
    }

    // Create new add-on
    const addOn = new AddOn({
      name: name.trim(),
      description: description?.trim() || '',
      price: Number(price),
      unit: unit?.trim() || 'หน่วย',
      isActive: isActive !== undefined ? isActive : true
    })

    await addOn.save()

    return NextResponse.json(addOn, { status: 201 })
  } catch (error: any) {
    return apiErrorResponse(error, 'ไม่สามารถสร้างอ๊อฟชั่นเสริมได้')
  }
}

