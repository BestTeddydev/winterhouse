import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

/**
 * GET /api/admin/users
 * ดึงรายการ users ทั้งหมด (เฉพาะ admin)
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role')

    const query: any = {}
    if (role) {
      query.role = role
    }

    const users = await User.find(query).select('-__v').lean()
    
    return NextResponse.json({
      success: true,
      users: users,
      data: users // Keep backward compatibility
    })
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch users' 
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/users
 * สร้าง user ใหม่ (เฉพาะ admin)
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const body = await req.json()
    const { name, email, lineUserId, role, image } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { lineUserId }] 
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User already exists with this email or LINE ID' },
        { status: 409 }
      )
    }

    // Create new user
    const user = new User({
      name,
      email,
      lineUserId,
      role: role || 'CUSTOMER',
      image: image || '',
      createdAt: new Date(),
      updatedAt: new Date()
    })

    await user.save()

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User created successfully'
    })
  } catch (error: any) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create user' 
      },
      { status: 500 }
    )
  }
}

