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
  return `
🏠 การจองห้องพักใหม่

ห้อง: ${booking.room.name}
ผู้จอง: ${booking.guestName}
เช็คอิน: ${new Date(booking.checkIn).toLocaleDateString('th-TH')}
เช็คเอาท์: ${new Date(booking.checkOut).toLocaleDateString('th-TH')}
ราคารวม: ฿${booking.totalPrice}
สถานะ: ${booking.status}
  `.trim()
}

export function formatBookingStatusUpdate(booking: any, oldStatus: string) {
  return `
🔔 อัพเดทสถานะการจอง

ห้อง: ${booking.room.name}
เลขที่การจอง: ${booking.id.slice(0, 8)}
สถานะเดิม: ${oldStatus}
สถานะใหม่: ${booking.status}
เช็คอิน: ${new Date(booking.checkIn).toLocaleDateString('th-TH')}
เช็คเอาท์: ${new Date(booking.checkOut).toLocaleDateString('th-TH')}
  `.trim()
}

