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

    // Only allow EMPLOYEE role to check out
    if (session.user.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'เฉพาะพนักงานเท่านั้นที่สามารถเช็คเอาท์ได้' }, { status: 403 })
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
      return NextResponse.json({ error: 'เฉพาะพนักงานเท่านั้นที่สามารถเช็คเอาท์ได้' }, { status: 403 })
    }

    const body = await request.json()
    const { notes } = body

    // Get today's date (start of day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find today's attendance record
    const attendance = await EmployeeAttendance.findOne({
      employeeId: employee._id,
      checkInDate: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) // Next day
      }
    })

    if (!attendance) {
      return NextResponse.json({ 
        error: 'ไม่พบการเช็คอินวันนี้' 
      }, { status: 404 })
    }

    // Check if already checked out
    if (attendance.checkoutTime) {
      return NextResponse.json({ 
        error: 'คุณได้เช็คเอาท์แล้ววันนี้',
        attendance
      }, { status: 400 })
    }

    // Check if check-in was approved
    if (attendance.status !== 'APPROVED') {
      return NextResponse.json({ 
        error: 'กรุณารอการอนุมัติการเช็คอินก่อนเช็คเอาท์' 
      }, { status: 400 })
    }

    // Check if location is "เข้างาน" (only allow checkout for check-in)
    if (attendance.location !== 'เข้างาน') {
      return NextResponse.json({ 
        error: 'สามารถเช็คเอาท์ได้เฉพาะเมื่อเช็คเข้างานเท่านั้น' 
      }, { status: 400 })
    }

    // Update attendance with checkout time
    attendance.checkoutTime = new Date()
    if (notes) {
      attendance.notes = attendance.notes 
        ? `${attendance.notes}\nหมายเหตุออกงาน: ${notes}`
        : `หมายเหตุออกงาน: ${notes}`
    }
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
      const checkoutTime = new Date(attendance.checkoutTime).toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit'
      })

      // Calculate working hours
      const workDuration = new Date(attendance.checkoutTime.getTime() - attendance.checkInTime.getTime())
      const hours = Math.floor(workDuration.getTime() / (1000 * 60 * 60))
      const minutes = Math.floor((workDuration.getTime() % (1000 * 60 * 60)) / (1000 * 60))

      const message = `
✅ การเช็คเอาท์พนักงาน

👤 พนักงาน: ${employee.name || employee.email || 'ไม่ระบุชื่อ'}
📅 วันที่: ${checkInDate}
🕐 เข้างาน: ${checkInTime}
🕐 ออกงาน: ${checkoutTime}
⏱️ จำนวนชั่วโมง: ${hours} ชั่วโมง ${minutes} นาที
${notes ? `📝 หมายเหตุออกงาน: ${notes}` : ''}

กรุณาตรวจสอบในระบบแอดมิน
      `.trim()

      await sendLineNotification({
        userId: adminUserId,
        message
      })
    } catch (lineError) {
      // Log error but don't fail the checkout
      console.error('Error sending LINE notification:', lineError)
    }

    return NextResponse.json({
      message: 'เช็คเอาท์สำเร็จ',
      attendance
    }, { status: 200 })

  } catch (error: any) {
    console.error('Error checking out:', error)
    
    return NextResponse.json({ 
      error: 'ไม่สามารถเช็คเอาท์ได้',
      details: error.message 
    }, { status: 500 })
  }
}

