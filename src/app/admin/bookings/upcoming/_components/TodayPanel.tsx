import Image from 'next/image'
import { CalendarDays, Home, LogOut } from 'lucide-react'
import { bookingImage, stayName } from '@/lib/bookingDisplay'
import { formatCurrency } from '@/lib/utils'

const todayLabel = () =>
  new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Bangkok' })

function MoveList({ title, icon: Icon, empty, bookings }: { title: string; icon: typeof Home; empty: string; bookings: any[] }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Icon size={18} />
        {title} ({bookings.length})
      </h3>
      {bookings.length === 0 ? (
        <p className="text-sm opacity-75">{empty}</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const image = bookingImage(booking)
            return (
              <div key={booking.id} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                <div className="w-10 h-10 relative rounded-lg overflow-hidden flex-shrink-0">
                  <Image src={image.src} alt={image.alt} fill className="object-cover" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{booking.guestName}</p>
                  <p className="text-sm opacity-75">{stayName(booking)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatCurrency(booking.totalPrice)}</p>
                  <p className="text-xs opacity-75">{booking.guestCount || 1} คน</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Today's check-ins and check-outs; hidden on a quiet day */
export default function TodayPanel({ checkIns, checkOuts }: { checkIns: any[]; checkOuts: any[] }) {
  if (checkIns.length === 0 && checkOuts.length === 0) return null
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 mb-8 text-white">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays size={24} />
          กิจกรรมวันนี้
        </h2>
        <div className="text-sm opacity-90">{todayLabel()}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MoveList title="เช็คอินวันนี้" icon={Home} empty="ไม่มีการเช็คอิน" bookings={checkIns} />
        <MoveList title="เช็คเอาท์วันนี้" icon={LogOut} empty="ไม่มีการเช็คเอาท์" bookings={checkOuts} />
      </div>
    </div>
  )
}
