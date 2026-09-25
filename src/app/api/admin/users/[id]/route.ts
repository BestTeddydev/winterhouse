import { NextRequest, NextResponse } from 'next/server'
import { ApiError, apiErrorResponse, requireSession } from '@/lib/api-auth'
import connectDB from '@/lib/db'
import User from '@/models/User'

// Always read live data; never pre-render at build time
export const dynamic = 'force-dynamic'

type Params = { params: { id: string } }

/**
 * GET /api/admin/users/[id]
 */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireSession('ADMIN', 'OWNER')
    await connectDB()

    const user = await User.findById(params.id)
    if (!user) throw new ApiError(404, 'ไม่พบผู้ใช้')

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    return apiErrorResponse(error, 'ไม่สามารถดึงข้อมูลผู้ใช้ได้')
  }
}

/**
 * PATCH /api/admin/users/[id]
 * แก้ไขข้อมูล user เช่นเปลี่ยน role (ADMIN เท่านั้น)
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireSession('ADMIN')
    await connectDB()

    const user = await User.findById(params.id)
    if (!user) throw new ApiError(404, 'ไม่พบผู้ใช้')

    const body = await req.json()
    for (const field of ['name', 'email', 'role', 'image'] as const) {
      if (body[field] !== undefined) user[field] = body[field]
    }
    await user.save()

    return NextResponse.json({ success: true, data: user, message: 'User updated successfully' })
  } catch (error) {
    return apiErrorResponse(error, 'ไม่สามารถแก้ไขผู้ใช้ได้')
  }
}

/**
 * DELETE /api/admin/users/[id]
 * ลบ user (ADMIN เท่านั้น)
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireSession('ADMIN')
    if (session.user.id === params.id) throw new ApiError(400, 'ไม่สามารถลบบัญชีของตัวเองได้')
    await connectDB()

    const user = await User.findByIdAndDelete(params.id)
    if (!user) throw new ApiError(404, 'ไม่พบผู้ใช้')

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    return apiErrorResponse(error, 'ไม่สามารถลบผู้ใช้ได้')
  }
}
