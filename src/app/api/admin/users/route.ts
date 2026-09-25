import { NextRequest, NextResponse } from 'next/server'
import { ApiError, apiErrorResponse, requireSession } from '@/lib/api-auth'
import connectDB from '@/lib/db'
import User from '@/models/User'

// Always read live data; never pre-render at build time
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/users?role=EMPLOYEE
 * รายชื่อ user (ADMIN / OWNER)
 */
export async function GET(req: NextRequest) {
  try {
    await requireSession('ADMIN', 'OWNER')
    await connectDB()

    const role = req.nextUrl.searchParams.get('role')
    const users = await User.find(role ? { role } : {}).lean()

    return NextResponse.json({
      success: true,
      users,
      data: users, // Keep backward compatibility
    })
  } catch (error) {
    return apiErrorResponse(error, 'ไม่สามารถดึงข้อมูลผู้ใช้ได้')
  }
}

/**
 * POST /api/admin/users
 * สร้าง user ใหม่ (ADMIN เท่านั้น)
 */
export async function POST(req: NextRequest) {
  try {
    await requireSession('ADMIN')
    await connectDB()

    const { name, email, lineUserId, role, image } = await req.json()
    if (!name || !email) throw new ApiError(400, 'ต้องระบุชื่อและอีเมล')

    const conditions: Record<string, string>[] = [{ email }]
    if (lineUserId) conditions.push({ lineUserId })
    if (await User.findOne({ $or: conditions })) {
      throw new ApiError(409, 'มีผู้ใช้อีเมลหรือ LINE ID นี้อยู่แล้ว')
    }

    const user = await User.create({ name, email, lineUserId, role: role || 'CUSTOMER', image: image || '' })

    return NextResponse.json({ success: true, data: user, message: 'User created successfully' })
  } catch (error) {
    return apiErrorResponse(error, 'ไม่สามารถสร้างผู้ใช้ได้')
  }
}
