import type { ReactNode } from 'react'
import { stayName } from '@/lib/bookingDisplay'

const thaiDate = (date: string) => new Date(date).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' })

/** What is being paid for, with the amounts below */
export default function PaymentSidebar({ booking, children }: { booking: any; children: ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
      <h2 className="text-xl font-bold mb-4">สรุปการจอง</h2>

      <div className="mb-4">
        <h3 className="font-semibold">{stayName(booking)}</h3>
        <p className="text-gray-600 text-sm mt-1">ผู้เข้าพัก: {booking.guestName || 'ไม่ระบุชื่อผู้เข้าพัก'}</p>
      </div>

      <div className="border-t border-b py-4 mb-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">เช็คอิน</span>
          <span className="font-medium">{thaiDate(booking.checkIn)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">เช็คเอาท์</span>
          <span className="font-medium">{thaiDate(booking.checkOut)}</span>
        </div>
      </div>

      <div className="border-t pt-4">{children}</div>
    </div>
  )
}
