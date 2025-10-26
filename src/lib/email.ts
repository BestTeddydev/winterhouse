import { Resend } from 'resend'

// Only create Resend client if RESEND_API_KEY is available
let resend: Resend | null = null

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY)
}

export interface EmailNotification {
  to: string
  subject: string
  html: string
}

export async function sendEmailNotification({ to, subject, html }: EmailNotification) {
  if (!resend) {
    throw new Error('Resend is not configured. Please set RESEND_API_KEY environment variable.')
  }
  
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Winter House <noreply@winterhouse.com>',
      to: [to],
      subject,
      html,
    })

    if (error) {
      console.error('Error sending email:', error)
      throw error
    }

    console.log('Email sent successfully:', data?.id)
    return data
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

export function formatPaymentNotificationEmail(booking: any, payment: any) {
  const checkInDate = new Date(booking.checkIn).toLocaleDateString('th-TH')
  const checkOutDate = new Date(booking.checkOut).toLocaleDateString('th-TH')
  const paymentDate = new Date().toLocaleDateString('th-TH')
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>การชำระเงินใหม่ - ${booking.roomId?.name || 'Room'}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #3b82f6; }
        .amount { font-size: 24px; font-weight: bold; color: #059669; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 การชำระเงินใหม่</h1>
          <p>มีลูกค้าชำระเงินสำหรับการจองห้องพักแล้ว</p>
        </div>
        
        <div class="content">
          <div class="info-box">
            <h3>🏠 ข้อมูลห้องพัก</h3>
            <p><strong>ห้อง:</strong> ${booking.roomId?.name || 'Room'}</p>
            <p><strong>เช็คอิน:</strong> ${checkInDate}</p>
            <p><strong>เช็คเอาท์:</strong> ${checkOutDate}</p>
            <p><strong>จำนวนคืน:</strong> ${Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24))} คืน</p>
          </div>
          
          <div class="info-box">
            <h3>👤 ข้อมูลลูกค้า</h3>
            <p><strong>ชื่อ:</strong> ${booking.guestName}</p>
            <p><strong>อีเมล:</strong> ${booking.guestEmail}</p>
            <p><strong>เบอร์โทร:</strong> ${booking.guestPhone}</p>
          </div>
          
          <div class="info-box">
            <h3>💳 ข้อมูลการชำระเงิน</h3>
            <p><strong>เลขที่การจอง:</strong> ${booking._id}</p>
            <p><strong>วันที่ชำระ:</strong> ${paymentDate}</p>
            <p><strong>ประเภทการชำระ:</strong> ${payment.paymentType === 'FULL' ? 'ชำระเต็มจำนวน' : payment.paymentType === 'PARTIAL' ? 'ชำระบางส่วน' : 'ชำระส่วนที่เหลือ'}</p>
            <p><strong>จำนวนเงิน:</strong> <span class="amount">฿${payment.totalAmount.toLocaleString()}</span></p>
            <p><strong>สถานะ:</strong> <span style="color: #059669; font-weight: bold;">ชำระเงินแล้ว</span></p>
          </div>
          
          ${booking.specialRequests ? `
          <div class="info-box">
            <h3>📝 ความต้องการพิเศษ</h3>
            <p>${booking.specialRequests}</p>
          </div>
          ` : ''}
          
          <div class="info-box">
            <h3>🔗 การจัดการ</h3>
            <p>กรุณาตรวจสอบและจัดการการจองในระบบแอดมิน</p>
            <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/bookings" style="color: #3b82f6;">ไปยังหน้าจัดการการจอง</a></p>
          </div>
        </div>
        
        <div class="footer">
          <p>อีเมลนี้ส่งโดยระบบ Winter House</p>
          <p>เวลาที่ส่ง: ${new Date().toLocaleString('th-TH')}</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function formatCustomerThankYouEmail(booking: any, payment: any) {
  const checkInDate = new Date(booking.checkIn).toLocaleDateString('th-TH')
  const checkOutDate = new Date(booking.checkOut).toLocaleDateString('th-TH')
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>ขอบคุณสำหรับการจอง - Winter House</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { border-left: 4px solid #059669; }
        .amount { font-size: 28px; font-weight: bold; color: #059669; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .contact { background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 ขอบคุณสำหรับการจอง!</h1>
          <p>การชำระเงินของคุณเสร็จสิ้นแล้ว</p>
        </div>
        
        <div class="content">
          <div class="info-box success">
            <h3>✅ การจองได้รับการยืนยัน</h3>
            <p>การจองของคุณได้รับการยืนยันแล้ว เราจะติดต่อกลับเพื่อยืนยันรายละเอียดเพิ่มเติม</p>
          </div>
          
          <div class="info-box">
            <h3>🏠 รายละเอียดการจอง</h3>
            <p><strong>ห้อง:</strong> ${booking.roomId?.name || 'Room'}</p>
            <p><strong>เช็คอิน:</strong> ${checkInDate}</p>
            <p><strong>เช็คเอาท์:</strong> ${checkOutDate}</p>
            <p><strong>จำนวนคืน:</strong> ${Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24))} คืน</p>
            <p><strong>เลขที่การจอง:</strong> ${booking._id}</p>
          </div>
          
          <div class="info-box">
            <h3>💳 ข้อมูลการชำระเงิน</h3>
            <p><strong>จำนวนเงิน:</strong> <span class="amount">฿${payment.totalAmount.toLocaleString()}</span></p>
            <p><strong>สถานะ:</strong> <span style="color: #059669; font-weight: bold;">ชำระเงินแล้ว</span></p>
            <p><strong>วันที่ชำระ:</strong> ${new Date().toLocaleDateString('th-TH')}</p>
          </div>
          
          ${booking.specialRequests ? `
          <div class="info-box">
            <h3>📝 ความต้องการพิเศษ</h3>
            <p>${booking.specialRequests}</p>
          </div>
          ` : ''}
          
          <div class="contact">
            <h3>📞 ติดต่อเรา</h3>
            <p>หากมีคำถามหรือต้องการความช่วยเหลือ กรุณาติดต่อเราได้ที่:</p>
            <p>📧 อีเมล: ${process.env.ADMIN_EMAIL || 'admin@winterhouse.com'}</p>
            <p>📱 โทรศัพท์: ${process.env.ADMIN_PHONE || '02-xxx-xxxx'}</p>
          </div>
          
          <div class="info-box">
            <h3>🎯 สิ่งที่ต้องทำต่อไป</h3>
            <ul>
              <li>รอการติดต่อกลับจากทีมงานเพื่อยืนยันรายละเอียด</li>
              <li>เตรียมเอกสารที่จำเป็นสำหรับการเช็คอิน</li>
              <li>ตรวจสอบข้อมูลการเดินทางและที่พัก</li>
            </ul>
          </div>
        </div>
        
        <div class="footer">
          <p>ขอบคุณที่เลือกใช้บริการ Winter House</p>
          <p>เราหวังว่าจะได้ต้อนรับคุณในเร็วๆ นี้</p>
          <p>เวลาที่ส่ง: ${new Date().toLocaleString('th-TH')}</p>
        </div>
      </div>
    </body>
    </html>
  `
}
