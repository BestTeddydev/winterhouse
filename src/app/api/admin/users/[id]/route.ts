import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import mongoose from 'mongoose'

/**
 * GET /api/admin/users/[id]
 * ดึงข้อมูล user ตาม ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    const { id } = params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    const user = await User.findById(id).select('-__v')

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user
    })
  } catch (error: any) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch user' 
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/users/[id]
 * อัพเดทข้อมูล user (เช่น เปลี่ยน role เป็น ADMIN)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    const { id } = params
    const body = await req.json()

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    const user = await User.findById(id)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user fields
    if (body.name !== undefined) user.name = body.name
    if (body.email !== undefined) user.email = body.email
    if (body.role !== undefined) user.role = body.role
    if (body.image !== undefined) user.image = body.image
    user.updatedAt = new Date()

    await user.save()

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update user' 
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/users/[id]
 * ลบ user
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()

    const { id } = params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    const user = await User.findByIdAndDelete(id)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to delete user' 
      },
      { status: 500 }
    )
  }
}

