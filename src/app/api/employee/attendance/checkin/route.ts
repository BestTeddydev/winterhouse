import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import EmployeeAttendance from '@/models/EmployeeAttendance'
import User from '@/models/User'
import mongoose from 'mongoose'
import { sendLineNotification } from '@/lib/line'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    // Only allow EMPLOYEE role to check in
    if (session.user.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'เฉพาะพนักงานเท่านั้นที่สามารถเช็คอินได้' }, { status: 403 })
    }

    await connectDB()

    // Get employee user
    let employee
    if (mongoose.Types.ObjectId.isValid(session.user.id)) {
      employee = await User.findById(session.user.id)
    } else {
      employee = await User.findOne({ lineUserId: session.user.id })
    }

    if (!employee) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลพนักงาน' }, { status: 404 })
    }

    if (employee.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'เฉพาะพนักงานเท่านั้นที่สามารถเช็คอินได้' }, { status: 403 })
    }

    const body = await request.json()
    const { location, notes } = body

    // Get today's date (start of day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if already checked in today
    const existingCheckIn = await EmployeeAttendance.findOne({
      employeeId: employee._id,
      checkInDate: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) // Next day
      }
    })

    if (existingCheckIn) {
      return NextResponse.json({ 
        error: 'คุณได้เช็คอินแล้ววันนี้',
        attendance: existingCheckIn
      }, { status: 400 })
    }

    // Create new attendance record
    const attendance = new EmployeeAttendance({
      employeeId: employee._id,
      checkInDate: today,
      checkInTime: new Date(),
      location: location || '',
      notes: notes || '',
      status: 'PENDING'
    })

    await attendance.save()

    // Populate employee info
    await attendance.populate('employeeId', 'name email')

    // Send LINE notification to admin
    try {
      const adminUserId = 'U20f6d7016c89095e75cc5d906f3536ce'
      const checkInDate = new Date(attendance.checkInDate).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      })
      const checkInTime = new Date(attendance.checkInTime).toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit'
      })

      const message = `
🔔 การเช็คอินพนักงานใหม่

👤 พนักงาน: ${employee.name || employee.email || 'ไม่ระบุชื่อ'}
📅 วันที่: ${checkInDate}
🕐 เวลา: ${checkInTime}
📍 ประเภท: ${attendance.location || 'ไม่ระบุ'}
${attendance.notes ? `📝 หมายเหตุ: ${attendance.notes}` : ''}
📊 สถานะ: รอการอนุมัติ

กรุณาตรวจสอบและอนุมัติในระบบแอดมิน
      `.trim()

      await sendLineNotification({
        userId: adminUserId,
        message
      })
    } catch (lineError) {
      // Log error but don't fail the check-in
      console.error('Error sending LINE notification:', lineError)
    }

    return NextResponse.json({
      message: 'เช็คอินสำเร็จ รอการอนุมัติ',
      attendance
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error checking in:', error)
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json({ 
        error: 'คุณได้เช็คอินแล้ววันนี้' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'ไม่สามารถเช็คอินได้',
      details: error.message 
    }, { status: 500 })
  }
}

