import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import EmployeeAttendance from '@/models/EmployeeAttendance'
import User from '@/models/User'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // PENDING, APPROVED, REJECTED, all
    const employeeId = searchParams.get('employeeId')
    const date = searchParams.get('date') // YYYY-MM-DD format
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build query
    const query: any = {}

    // If user is EMPLOYEE, only show their own attendance
    if (session.user.role === 'EMPLOYEE') {
      let employee
      if (mongoose.Types.ObjectId.isValid(session.user.id)) {
        employee = await User.findById(session.user.id)
      } else {
        employee = await User.findOne({ lineUserId: session.user.id })
      }

      if (!employee) {
        return NextResponse.json({ error: 'ไม่พบข้อมูลพนักงาน' }, { status: 404 })
      }

      query.employeeId = employee._id
    } else if (session.user.role === 'ADMIN' || session.user.role === 'OWNER') {
      // Admin/Owner can see all or filter by employeeId
      if (employeeId && mongoose.Types.ObjectId.isValid(employeeId)) {
        query.employeeId = new mongoose.Types.ObjectId(employeeId)
      }
    } else {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 403 })
    }

    // Filter by status
    if (status && status !== 'all') {
      query.status = status
    }

    // Filter by date
    if (date) {
      const dateObj = new Date(date)
      dateObj.setHours(0, 0, 0, 0)
      const nextDay = new Date(dateObj)
      nextDay.setDate(nextDay.getDate() + 1)

      query.checkInDate = {
        $gte: dateObj,
        $lt: nextDay
      }
    }

    // Get total count
    const total = await EmployeeAttendance.countDocuments(query)

    // Calculate pagination
    const skip = (page - 1) * limit
    const totalPages = Math.ceil(total / limit)

    // Fetch attendance records
    const attendanceRecords = await EmployeeAttendance.find(query)
      .populate('employeeId', 'name email role')
      .populate('approvedBy', 'name email')
      .sort({ checkInDate: -1, checkInTime: -1 })
      .skip(skip)
      .limit(limit)

    return NextResponse.json({
      attendance: attendanceRecords,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    })

  } catch (error: any) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json({ 
      error: 'ไม่สามารถดึงข้อมูลการเช็คอินได้',
      details: error.message 
    }, { status: 500 })
  }
}

