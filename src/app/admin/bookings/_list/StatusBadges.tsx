import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'
import { TONE_CLASSES, bookingStatusTone, paymentStatusTone, type Tone } from '@/lib/bookingStatus'

const ICONS: Record<Tone, typeof Clock> = { yellow: Clock, green: CheckCircle, red: XCircle, blue: CheckCircle, gray: AlertCircle }
const ICON_COLOR: Record<Tone, string> = {
  yellow: 'text-yellow-500',
  green: 'text-green-500',
  red: 'text-red-500',
  blue: 'text-blue-500',
  gray: 'text-gray-500',
}
const BADGE = 'px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1'

function Badge({ tone, label, iconSize, className = '' }: { tone: Tone; label: string; iconSize: string; className?: string }) {
  const Icon = ICONS[tone]
  return (
    <span className={`${BADGE} ${className} ${TONE_CLASSES[tone].badge}`}>
      <Icon className={`${ICON_COLOR[tone]} ${iconSize}`} />
      {label}
    </span>
  )
}

export const BookingStatusBadge = ({ status, className }: { status: string; className?: string }) => (
  <Badge tone={bookingStatusTone(status)} label={status} iconSize="w-4 h-4 sm:w-5 sm:h-5" className={className} />
)

export const PaymentStatusBadge = ({ status, className }: { status?: string; className?: string }) => (
  <Badge tone={paymentStatusTone(status)} label={status || 'PENDING'} iconSize="w-3 h-3 sm:w-4 sm:h-4" className={className} />
)
