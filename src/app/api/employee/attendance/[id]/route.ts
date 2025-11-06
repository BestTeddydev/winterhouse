import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import EmployeeAttendance from '@/models/EmployeeAttendance'
import mongoose from 'mongoose'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    // Only ADMIN or OWNER can approve/reject
    if (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER') {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 403 })
    }

    await connectDB()

    const { id } = params
    const body = await request.json()
    const { status, rejectionReason } = body

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ 
        error: 'สถานะไม่ถูกต้อง ต้องเป็น APPROVED หรือ REJECTED' 
      }, { status: 400 })
    }

    if (status === 'REJECTED' && !rejectionReason) {
      return NextResponse.json({ 
        error: 'กรุณาระบุเหตุผลในการปฏิเสธ' 
      }, { status: 400 })
    }

    // Find attendance record
    const attendance = await EmployeeAttendance.findById(id)

    if (!attendance) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการเช็คอิน' }, { status: 404 })
    }

    // Check if already approved/rejected
    if (attendance.status !== 'PENDING') {
      return NextResponse.json({ 
        error: `การเช็คอินนี้ถูก${attendance.status === 'APPROVED' ? 'อนุมัติ' : 'ปฏิเสธ'}แล้ว` 
      }, { status: 400 })
    }

    // Get admin user
    let admin
    if (mongoose.Types.ObjectId.isValid(session.user.id)) {
      admin = await mongoose.models.User?.findById(session.user.id)
    } else {
      admin = await mongoose.models.User?.findOne({ lineUserId: session.user.id })
    }

    if (!admin) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลผู้ดูแลระบบ' }, { status: 404 })
    }

    // Update attendance
    attendance.status = status as 'APPROVED' | 'REJECTED'
    attendance.approvedBy = admin._id
    attendance.approvedAt = new Date()
    
    if (status === 'REJECTED' && rejectionReason) {
      attendance.rejectionReason = rejectionReason
    }

    await attendance.save()

    // Populate for response
    await attendance.populate('employeeId', 'name email')
    await attendance.populate('approvedBy', 'name email')

    return NextResponse.json({
      message: `การเช็คอิน${status === 'APPROVED' ? 'อนุมัติ' : 'ปฏิเสธ'}เรียบร้อย`,
      attendance
    })

  } catch (error: any) {
    console.error('Error updating attendance:', error)
    
    if (error instanceof mongoose.Error.CastError) {
      return NextResponse.json({ 
        error: 'รูปแบบ ID ไม่ถูกต้อง' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'ไม่สามารถอัพเดทสถานะการเช็คอินได้',
      details: error.message 
    }, { status: 500 })
  }
}

