import Link from 'next/link'
import { CheckCircle, Edit, XCircle } from 'lucide-react'
import { nextStatuses } from '../_lib/bookingList'

const ACTIONS = {
  CONFIRMED: { label: 'ยืนยัน', icon: CheckCircle, color: 'bg-green-600 hover:bg-green-700' },
  COMPLETED: { label: 'เสร็จสิ้น', icon: CheckCircle, color: 'bg-blue-600 hover:bg-blue-700' },
  CANCELLED: { label: 'ยกเลิก', icon: XCircle, color: 'bg-red-600 hover:bg-red-700' },
} as const

interface Props {
  booking: any
  onStatusChange: (id: string, status: string) => void
  /** Table cells are narrow: small buttons, labels only from `sm` up */
  compact?: boolean
}

/** Edit / confirm / complete / cancel buttons of a booking row or card */
export default function BookingActions({ booking, onStatusChange, compact = false }: Props) {
  const button = compact
    ? 'px-2 sm:px-3 py-1 sm:py-1.5 text-white rounded text-xs font-medium transition-colors flex items-center gap-1'
    : 'px-3 py-1.5 text-white rounded text-xs font-medium transition-colors flex items-center gap-1'
  const icon = compact ? 'w-3 h-3 sm:w-3.5 sm:h-3.5' : 'w-3.5 h-3.5'
  const label = (text: string) => (compact ? <span className="hidden sm:inline">{text}</span> : text)

  return (
    <div
      className={compact ? 'flex flex-wrap items-center gap-1 sm:gap-2' : 'flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200'}
      onClick={(e) => e.stopPropagation()}
    >
      <Link href={`/admin/bookings/${booking.id}/edit`} className={`${button} bg-gray-600 hover:bg-gray-700`}>
        <Edit className={icon} />
        {label('แก้ไข')}
      </Link>
      {nextStatuses(booking.status).map((status) => {
        const action = ACTIONS[status]
        return (
          <button key={status} type="button" onClick={() => onStatusChange(booking.id, status)} className={`${button} ${action.color}`}>
            <action.icon className={icon} />
            {label(action.label)}
          </button>
        )
      })}
    </div>
  )
}
