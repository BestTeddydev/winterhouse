import Image from 'next/image'
import Link from 'next/link'
import { AlertCircle, ArrowRight, Bed, Calendar, CheckCircle, Clock, Edit, Eye, Home, LogOut, Mail, Phone, Users, XCircle } from 'lucide-react'
import { bookingImage, stayName } from '@/lib/bookingDisplay'
import { TONE_CLASSES, bookingStatusTone, type Tone } from '@/lib/bookingStatus'
import { formatCurrency } from '@/lib/utils'
import type { Activity } from './upcoming'

const STATUS_ICONS: Record<Tone, typeof Clock> = { yellow: Clock, green: CheckCircle, red: XCircle, blue: CheckCircle, gray: AlertCircle }
const STATUS_ICON_COLORS: Record<Tone, string> = {
  yellow: 'text-yellow-500',
  green: 'text-green-500',
  red: 'text-red-500',
  blue: 'text-blue-500',
  gray: 'text-gray-500',
}
const ACTIVITIES: Record<Activity, { label: string; color: string; icon: typeof Home }> = {
  checkin: { label: 'เช็คอิน', color: 'bg-green-100 text-green-800', icon: Home },
  checkout: { label: 'เช็คเอาท์', color: 'bg-orange-100 text-orange-800', icon: LogOut },
  staying: { label: 'กำลังพัก', color: 'bg-blue-100 text-blue-800', icon: Bed },
  upcoming: { label: 'จะมาถึง', color: 'bg-purple-100 text-purple-800', icon: Calendar },
}
const thaiDate = (date: string) => new Date(date).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' })

export default function UpcomingBookingRow({ booking, activity }: { booking: any; activity: Activity }) {
  const image = bookingImage(booking)
  const tone = bookingStatusTone(booking.status)
  const StatusIcon = STATUS_ICONS[tone]
  const act = ACTIVITIES[activity]

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 relative rounded-lg overflow-hidden flex-shrink-0">
          <Image src={image.src} alt={image.alt} fill className="object-cover" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900">{booking.guestName}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${TONE_CLASSES[tone].badge} ${TONE_CLASSES[tone].border}`}>
              <StatusIcon className={STATUS_ICON_COLORS[tone]} size={16} />
              <span className="ml-1">{booking.status}</span>
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${act.color}`}>
              <act.icon size={16} />
              <span className="ml-1">{act.label}</span>
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">{stayName(booking)}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {thaiDate(booking.checkIn)}
            </span>
            <ArrowRight size={12} />
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {thaiDate(booking.checkOut)}
            </span>
            <span className="flex items-center gap-1">
              <Users size={12} />
              {booking.guestCount || 1} คน
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-bold text-primary-600 text-lg">{formatCurrency(booking.totalPrice)}</p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Mail size={12} />
            <span>{booking.guestEmail}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Phone size={12} />
            <span>{booking.guestPhone}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href={`/admin/bookings/${booking.id}/edit`}
            className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Edit size={14} />
            แก้ไข
          </Link>
          <Link
            href={`/bookings/${booking.id}`}
            className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Eye size={14} />
            ดูรายละเอียด
          </Link>
        </div>
      </div>
    </div>
  )
}
