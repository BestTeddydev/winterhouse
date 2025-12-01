import axios from 'axios'

const LINE_MESSAGING_API_URL = 'https://api.line.me/v2/bot/message/push'

export interface LineNotification {
  userId: string
  message: string
}

export async function sendLineNotification({ userId, message }: LineNotification) {
  try {
    const response = await axios.post(
      LINE_MESSAGING_API_URL,
      {
        to: userId,
        messages: [
          {
            type: 'text',
            text: message,
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
        },
      }
    )
    return response.data
  } catch (error) {
    console.error('Error sending LINE notification:', error)
    throw error
  }
}

export function formatBookingNotification(booking: any) {
  // Get room names (support both single and multiple rooms)
  let roomNames = 'N/A'
  if (booking.roomIds && booking.roomIds.length > 0) {
    roomNames = booking.roomIds.map((r: any) => r?.name || 'N/A').join(', ')
  } else if (booking.roomId) {
    roomNames = booking.roomId?.name || 'N/A'
  }
  
  const checkInDate = new Date(booking.checkIn).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const checkOutDate = new Date(booking.checkOut).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  const nights = Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24))
  
  // Format payment type
  const paymentTypeText = booking.paymentType === 'PARTIAL' ? 'จ่ายบางส่วน' : 'จ่ายเต็มจำนวน'
  
  // Format booking source
  const bookingSource = booking.isManualBooking ? '📝 Admin สร้าง' : '🌐 ลูกค้าสร้าง'
  
  return `
🏠 การจองห้องพักใหม่

${bookingSource}

📋 รายละเอียดการจอง:
ห้อง: ${roomNames}
ผู้จอง: ${booking.guestName}
📧 อีเมล: ${booking.guestEmail || 'N/A'}
📱 เบอร์โทร: ${booking.guestPhone || 'N/A'}

📅 วันที่เข้าพัก:
เช็คอิน: ${checkInDate}
เช็คเอาท์: ${checkOutDate}
จำนวนคืน: ${nights} คืน

💰 ราคา:
ราคารวม: ฿${booking.totalPrice?.toLocaleString() || '0'}
ประเภทการชำระ: ${paymentTypeText}
${booking.discount > 0 ? `ส่วนลด: ${booking.discount}%` : ''}
${booking.discountAmount > 0 ? `ส่วนลด: ฿${booking.discountAmount.toLocaleString()}` : ''}

📊 สถานะ: ${booking.status === 'CONFIRMED' ? '✅ ยืนยันแล้ว' : booking.status === 'PENDING' ? '⏳ รอดำเนินการ' : booking.status}

🆔 เลขที่การจอง: ${booking._id?.toString().slice(-8) || 'N/A'}


  `.trim()
}

export function formatPaymentThankYouMessage(booking: any, payment: any) {
  const checkInDate = new Date(booking.checkIn).toLocaleDateString('th-TH')
  const checkOutDate = new Date(booking.checkOut).toLocaleDateString('th-TH')
  
  // Check if this is a partial payment booking
  const isPartialPayment = booking.paymentType === 'PARTIAL'
  const isRemainingPayment = payment.paymentType === 'REMAINING'
  
  let paymentInfo = ''
  let paymentStatus = ''
  
  if (isPartialPayment && !isRemainingPayment) {
    // Initial deposit payment
    paymentInfo = `มัดจำ: ฿${payment.amount.toLocaleString()}
ราคารวม: ฿${payment.totalAmount.toLocaleString()}
ส่วนที่เหลือ: ฿${payment.remainingAmount.toLocaleString()}`
    paymentStatus = 'ชำระมัดจำแล้ว ✅'
  } else if (isPartialPayment && isRemainingPayment) {
    // Remaining payment
    paymentInfo = `มัดจำ: ฿${(payment.totalAmount - payment.amount).toLocaleString()}
ส่วนที่เหลือ: ฿${payment.amount.toLocaleString()}
ราคารวม: ฿${payment.totalAmount.toLocaleString()}`
    paymentStatus = 'ชำระเงินครบแล้ว ✅'
  } else {
    // Full payment
    paymentInfo = `จำนวนเงิน: ฿${payment.totalAmount.toLocaleString()}`
    paymentStatus = 'ชำระเงินแล้ว ✅'
  }
  
  return `
🎉 ขอบคุณสำหรับการจอง บ้านลมหนาวคาเฟ่ แอนด์ แคมป์ปิ้ง!

✅ ${paymentStatus}
การจองของคุณได้รับการยืนยันแล้ว

🏠 รายละเอียดการจอง:
ห้อง: ${booking.roomId?.name || 'Room'}
เช็คอิน: ${checkInDate}
เช็คเอาท์: ${checkOutDate}
จำนวนคืน: ${Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24))} คืน
เลขที่การจอง: ${booking._id}

💳 ข้อมูลการชำระเงิน:
${paymentInfo}
สถานะ: ${paymentStatus}

${isPartialPayment && !isRemainingPayment ? '📝 หมายเหตุ: กรุณาชำระส่วนที่เหลือก่อนเช็คเอาท์' : ''}

📞 หากมีคำถาม กรุณาติดต่อเราได้ที่:
📧 ${process.env.ADMIN_EMAIL || 'baanlomnowcafeandcamping@gmail.com'}
📱 ${process.env.ADMIN_PHONE || '064-553-5691, 064-554-6591'}

เราหวังว่าจะได้ต้อนรับคุณในเร็วๆ นี้! 🏡✨
  `.trim()
}

export function formatAdminPaymentNotification(booking: any, payment: any) {
  const checkInDate = new Date(booking.checkIn).toLocaleDateString('th-TH')
  const checkOutDate = new Date(booking.checkOut).toLocaleDateString('th-TH')
  
  // Check if this is a partial payment booking
  const isPartialPayment = booking.paymentType === 'PARTIAL'
  const isRemainingPayment = payment.paymentType === 'REMAINING'
  
  let paymentInfo = ''
  let paymentStatus = ''
  
  if (isPartialPayment && !isRemainingPayment) {
    // Initial deposit payment
    paymentInfo = `มัดจำ: ฿${payment.amount.toLocaleString()}
ราคารวม: ฿${payment.totalAmount.toLocaleString()}
ส่วนที่เหลือ: ฿${payment.remainingAmount.toLocaleString()}`
    paymentStatus = 'ชำระมัดจำแล้ว ✅'
  } else if (isPartialPayment && isRemainingPayment) {
    // Remaining payment
    paymentInfo = `มัดจำ: ฿${(payment.totalAmount - payment.amount).toLocaleString()}
ส่วนที่เหลือ: ฿${payment.amount.toLocaleString()}
ราคารวม: ฿${payment.totalAmount.toLocaleString()}`
    paymentStatus = 'ชำระเงินครบแล้ว ✅'
  } else {
    // Full payment
    paymentInfo = `จำนวนเงิน: ฿${payment.totalAmount.toLocaleString()}`
    paymentStatus = 'ชำระเงินแล้ว ✅'
  }
  
  return `
💰 การชำระเงินใหม่

ห้อง: ${booking.roomId?.name || 'Room'}
ผู้จอง: ${booking.guestName}
เช็คอิน: ${checkInDate}
เช็คเอาท์: ${checkOutDate}

💳 ข้อมูลการชำระเงิน:
${paymentInfo}
สถานะ: ${paymentStatus}

กรุณาตรวจสอบในระบบแอดมิน
  `.trim()
}

export function formatBookingStatusUpdate(booking: any, oldStatus: string, newStatus: string) {
  const checkInDate = new Date(booking.checkIn).toLocaleDateString('th-TH')
  const checkOutDate = new Date(booking.checkOut).toLocaleDateString('th-TH')
  
  const statusMessages: { [key: string]: string } = {
    'PENDING': 'รอการยืนยัน',
    'CONFIRMED': 'ยืนยันแล้ว',
    'CANCELLED': 'ยกเลิก',
    'COMPLETED': 'เสร็จสิ้น',
    'CHECKED_IN': 'เช็คอินแล้ว',
    'CHECKED_OUT': 'เช็คเอาท์แล้ว'
  }
  
  const oldStatusText = statusMessages[oldStatus] || oldStatus
  const newStatusText = statusMessages[newStatus] || newStatus
  
  return `
📋 อัพเดทสถานะการจอง

ห้อง: ${booking.roomId?.name || 'Room'}
ผู้จอง: ${booking.guestName}
เช็คอิน: ${checkInDate}
เช็คเอาท์: ${checkOutDate}

สถานะเปลี่ยนจาก: ${oldStatusText}
เป็น: ${newStatusText}

เลขที่การจอง: ${booking._id}
  `.trim()
}

